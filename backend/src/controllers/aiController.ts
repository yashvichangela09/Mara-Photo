import { Request, Response } from 'express';
import { FaceEmbedding, Media, Studio } from '../models';
import { detectFaces } from '../lib/faceAi';

// face-api.js ResNet-34 Euclidean distance threshold (lower is closer/better)
const DISTANCE_THRESHOLD = 0.60; // Standard face-api.js match threshold

/**
 * Calculates Euclidean distance between two vectors.
 */
const euclideanDistance = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Maps Euclidean distance to a customer-friendly similarity score (0.0 to 1.0)
 * where 0.0 distance -> 100% similarity, and 0.6 distance -> 75% similarity.
 */
const distanceToSimilarity = (dist: number): number => {
  if (dist <= 0.6) {
    return 1.0 - (dist / 0.6) * 0.25;
  } else if (dist < 1.0) {
    return 0.75 * (1.0 - dist) / 0.4;
  }
  return 0;
};

/**
 * Search photos and videos by uploading a selfie.
 * Flow:
 *   1. Extract face embedding(s) using local face-api.js
 *   2. Fetch all face embeddings for the event from DB
 *   3. Compare using cosine similarity
 *   4. Return matched media sorted by similarity score
 */
export const searchBySelfie = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: 'Selfie photo file is required.' });
    }

    // 1. Detect faces locally
    let faces: any[] = [];
    try {
      faces = await detectFaces(file.buffer);
    } catch (aiErr: any) {
      console.error('[AI Search] Local face-api error:', aiErr.message);
      return res.status(500).json({ 
        error: 'AI Face Detection service error. Please try again later.' 
      });
    }

    if (faces.length === 0) {
      return res.status(400).json({ 
        error: 'No face detected in the uploaded photo. Please upload a clear, well-lit photo of your face.' 
      });
    }

    // Use the first (usually largest/most prominent) detected face
    const queryEmbedding = faces[0].embedding;

    // 2. Fetch all face embeddings for this event
    const eventEmbeddings = await FaceEmbedding.find({ eventId });

    if (eventEmbeddings.length === 0) {
      return res.json({ 
        matches: [],
        message: 'No photos have been processed for face detection in this event yet.',
      });
    }

    // 3. Compute Euclidean distances against all stored embeddings
    const matches: { mediaId: string; timestamp?: number; similarity: number }[] = [];
    
    for (const item of eventEmbeddings) {
      const distance = euclideanDistance(queryEmbedding, item.embedding);
      if (distance <= DISTANCE_THRESHOLD) {
        const similarity = distanceToSimilarity(distance);
        matches.push({
          mediaId: item.mediaId.toString(),
          timestamp: item.timestamp,
          similarity,
        });
      }
    }

    // 4. Group matches by Media ID (a single photo/video may have multiple face matches)
    const mediaGroups: { 
      [key: string]: { 
        bestSimilarity: number; 
        matchCount: number;
        timestamps: number[];
      } 
    } = {};

    for (const match of matches) {
      if (!mediaGroups[match.mediaId]) {
        mediaGroups[match.mediaId] = {
          bestSimilarity: match.similarity,
          matchCount: 0,
          timestamps: [],
        };
      }
      
      const group = mediaGroups[match.mediaId];
      group.matchCount++;
      
      // Track highest similarity for this media item
      if (match.similarity > group.bestSimilarity) {
        group.bestSimilarity = match.similarity;
      }
      
      // Track video timestamps
      if (match.timestamp !== undefined) {
        group.timestamps.push(match.timestamp);
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
      const similarityPercent = Math.round(group.bestSimilarity * 100);
      return {
        ...media.toObject(),
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= 0.85 ? 'HIGH' : 'MEDIUM',
        matchCount: group.matchCount,
        timestamps: group.timestamps,
      };
    });

    // Sort by similarity score (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Increment AI search usage
    if (mediaDetails.length > 0) {
      const firstMedia = mediaDetails[0];
      await Studio.findByIdAndUpdate(firstMedia.studioId, { $inc: { 'usage.aiSearchesCount': 1 } });
    }

    console.log(`[AI Search] Found ${results.length} matching media items for event ${eventId}`);

    return res.json({ 
      matches: results,
      totalSearched: eventEmbeddings.length,
      message: results.length > 0 
        ? `Found ${results.length} photo(s)/video(s) matching your face!`
        : 'No matching photos found. The event photos may not have been processed yet.',
    });
  } catch (err: any) {
    console.error('AI Face Search Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
