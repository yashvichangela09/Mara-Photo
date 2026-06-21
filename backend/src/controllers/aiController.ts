import { Request, Response } from 'express';
import axios from 'axios';
import { FaceEmbedding, Media, Studio } from '../models';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const SIMILARITY_THRESHOLD = 0.45; // Standard threshold for InsightFace ArcFace model

/**
 * Calculates dot product of two L2 normalized arrays (cosine similarity)
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
};

/**
 * Search photos and videos by uploading a selfie
 */
export const searchBySelfie = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: 'Selfie photo file is required' });
    }

    // 1. Call AI service to extract embedding for the selfie
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', fileBlob, 'selfie.jpg');

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const faces = aiResponse.data.faces || [];
    if (faces.length === 0) {
      return res.status(400).json({ error: 'No face detected in the selfie. Please upload a clear photo of your face.' });
    }

    // Use the largest/first detected face embedding
    const queryEmbedding = faces[0].embedding;

    // 2. Fetch all face embeddings for this event
    const eventEmbeddings = await FaceEmbedding.find({ eventId });

    // 3. Compute similarities
    const matches: any[] = [];
    for (const item of eventEmbeddings) {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        matches.push({
          mediaId: item.mediaId.toString(),
          timestamp: item.timestamp, // Will be present for videos
          similarity,
        });
      }
    }

    // 4. Group matches by Media ID
    const mediaGroups: { [key: string]: { similarity: number; timestamps: number[] } } = {};
    for (const match of matches) {
      if (!mediaGroups[match.mediaId]) {
        mediaGroups[match.mediaId] = {
          similarity: match.similarity,
          timestamps: [],
        };
      }
      // Track highest similarity
      if (match.similarity > mediaGroups[match.mediaId].similarity) {
        mediaGroups[match.mediaId].similarity = match.similarity;
      }
      // Add video timestamp if present
      if (match.timestamp !== undefined) {
        mediaGroups[match.mediaId].timestamps.push(match.timestamp);
      }
    }

    // Sort timestamps for video matches
    for (const mId in mediaGroups) {
      mediaGroups[mId].timestamps.sort((a, b) => a - b);
    }

    // 5. Populate Media details
    const matchedMediaIds = Object.keys(mediaGroups);
    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } });

    const results = mediaDetails.map((media) => {
      const group = mediaGroups[media._id.toString()];
      return {
        ...media.toObject(),
        similarity: parseFloat(group.similarity.toFixed(4)),
        timestamps: group.timestamps, // Sorted list of second timestamps for video scrubbing
      };
    });

    // Sort results by similarity score (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Increment AI search usage count for the Studio
    if (mediaDetails.length > 0) {
      const firstMedia = mediaDetails[0];
      await Studio.findByIdAndUpdate(firstMedia.studioId, { $inc: { 'usage.aiSearchesCount': 1 } });
    }

    return res.json({ matches: results });
  } catch (err: any) {
    console.error('AI Face Search Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
