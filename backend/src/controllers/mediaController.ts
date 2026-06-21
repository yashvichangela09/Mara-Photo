import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middlewares/auth';
import { Media, Event, Studio, FaceEmbedding } from '../models';
import { uploadToR2, getPresignedUrl } from '../services/R2Service';
import { photoQueue, videoQueue, processMediaLocal, isRedisAvailable } from '../workers/mediaWorker';

/**
 * Handle bulk photo and video uploads
 */
export const uploadMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const files = req.files as Express.Multer.File[];

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findById(event.studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const uploadedMediaList = [];

    let folderPathsArr: string[] = [];
    if (req.body.folderPaths) {
      folderPathsArr = Array.isArray(req.body.folderPaths) ? req.body.folderPaths : [req.body.folderPaths];
    }

    const offlineQueue: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const folderPath = folderPathsArr[i] || '';
      const isVideo = file.mimetype.startsWith('video/');
      const type = isVideo ? 'VIDEO' : 'PHOTO';
      
      // Enforce file size limit based on plan
      if (type === 'VIDEO' && studio.subscriptionPlan === 'STARTER') {
        return res.status(403).json({ error: 'Starter plan does not support video uploads. Please upgrade.' });
      }

      // Generate a unique R2 Key
      const fileExtension = file.originalname.split('.').pop() || '';
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const r2Key = `events/${eventId}/${type.toLowerCase()}s/${uniqueFilename}`;

      // Upload raw file buffer to Cloudflare R2
      const r2Url = await uploadToR2(file.buffer, r2Key, file.mimetype);

      // Save media record as PENDING
      const media = await Media.create({
        type,
        r2Key,
        r2Url,
        folderPath,
        eventId: event._id,
        studioId: event.studioId,
        size: file.size,
        uploadedBy: req.user._id,
        processedStatus: 'PENDING',
      });

      // Enqueue job or process synchronously
      if (isRedisAvailable && photoQueue && videoQueue) {
        try {
          if (type === 'PHOTO') {
            await photoQueue.add(`photo-job-${media._id}`, {
              mediaId: media._id,
              studioId: event.studioId,
            });
          } else {
            await videoQueue.add(`video-job-${media._id}`, {
              mediaId: media._id,
              studioId: event.studioId,
            });
          }
        } catch (queueErr: any) {
          console.warn(`[Queue Warning]: Redis queue error. Adding media ${media._id} to offline batch queue...`);
          offlineQueue.push({ id: media._id.toString(), type, studioId: event.studioId.toString() });
        }
      } else {
        // Redis offline – add to batch queue
        offlineQueue.push({ id: media._id.toString(), type, studioId: event.studioId.toString() });
      }

      uploadedMediaList.push(media);
    }

    if (offlineQueue.length > 0) {
      console.log(`[Upload] Redis offline. Processing ${offlineQueue.length} media items in background batches of 5.`);
      setTimeout(async () => {
        const processInBatches = async (items: any[], batchSize: number) => {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(batch.map(item => processMediaLocal(item.id, item.type, item.studioId).catch(procErr => {
              console.error(`[Sync Process Error]: Failed to process media ${item.id}:`, procErr);
            })));
          }
        };
        await processInBatches(offlineQueue, 5);
      }, 0);
    }

    return res.status(201).json({
      message: `${files.length} media file(s) uploaded and queued for processing`,
      media: uploadedMediaList,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get media files for the gallery (all statuses so users can see uploads in progress)
 */
export const getEventMedia = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { type } = req.query; // 'PHOTO' or 'VIDEO' optional filter

  try {
    const query: any = { eventId };
    if (type) {
      query.type = type;
    }

    const mediaList = await Media.find(query).sort({ createdAt: -1 });
    return res.json({ media: mediaList });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Returns presigned original download URLs for multiple media IDs
 */
export const downloadBulkMedia = async (req: Request, res: Response) => {
  const { mediaIds } = req.body; // array of mediaIds

  try {
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: 'Array of mediaIds is required' });
    }

    const downloadLinks = [];
    for (const id of mediaIds) {
      const media = await Media.findById(id);
      if (media && media.processedStatus === 'COMPLETED') {
        const presignedUrl = await getPresignedUrl(media.r2Key, 3600); // 1 hour expiry
        downloadLinks.push({
          id: media._id,
          filename: media.r2Key.split('/').pop(),
          url: presignedUrl,
        });
      }
    }

    return res.json({ downloads: downloadLinks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a media file
 */
export const deleteMedia = async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    // Validate that the request is from the owner or team member of the studio
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to delete this media' });
    }

    // Trigger delete in R2
    const { deleteFromR2 } = await import('../services/R2Service');
    await deleteFromR2(media.r2Key);
    if (media.thumbnailUrl && media.thumbnailUrl.includes('processed/')) {
      const thumbKey = `processed/thumb_${media.r2Key.split('/').pop()}`;
      await deleteFromR2(thumbKey);
    }
    if (media.compressedUrl && media.compressedUrl.includes('processed/')) {
      const compressedKey = `processed/gallery_${media.r2Key.split('/').pop()}`;
      await deleteFromR2(compressedKey);
    }

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: media._id });

    // Delete Media document
    await Media.findByIdAndDelete(mediaId);

    return res.json({ message: 'Media and associated embeddings deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk delete media (either specific IDs or all media for an event)
 */
export const deleteBulkMedia = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { mediaIds } = req.body; // optional array of media IDs

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Validate that the request is from the owner
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to delete media for this event' });
    }

    // Determine query
    const query: any = { eventId };
    if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
      query._id = { $in: mediaIds };
    }

    const mediaList = await Media.find(query);
    if (mediaList.length === 0) {
      return res.json({ message: 'No media found to delete' });
    }

    const { deleteFromR2 } = await import('../services/R2Service');

    // Delete from R2 sequentially or batched (sequentially to avoid overwhelming mock fallback)
    for (const media of mediaList) {
      await deleteFromR2(media.r2Key).catch(err => console.warn(`Failed to delete ${media.r2Key}:`, err));
      if (media.thumbnailUrl && media.thumbnailUrl.includes('processed/')) {
        const thumbKey = `processed/thumb_${media.r2Key.split('/').pop()}`;
        await deleteFromR2(thumbKey).catch(() => {});
      }
      if (media.compressedUrl && media.compressedUrl.includes('processed/')) {
        const compressedKey = `processed/gallery_${media.r2Key.split('/').pop()}`;
        await deleteFromR2(compressedKey).catch(() => {});
      }
    }

    const idsToDelete = mediaList.map(m => m._id);

    // Delete embeddings
    await FaceEmbedding.deleteMany({ mediaId: { $in: idsToDelete } });

    // Delete Media documents
    await Media.deleteMany({ _id: { $in: idsToDelete } });

    return res.json({ message: `${mediaList.length} media items deleted successfully` });
  } catch (err: any) {
    console.error('Bulk Delete Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Uploads a whitelabel asset (logos, cover images) to Cloudflare R2 and returns its URL.
 */
export const uploadAsset = async (req: AuthRequest, res: Response) => {
  const file = req.file;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const r2Key = `branding/assets/${uniqueFilename}`;

    const url = await uploadToR2(file.buffer, r2Key, file.mimetype);

    return res.json({ url });
  } catch (err: any) {
    console.error('Asset Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

