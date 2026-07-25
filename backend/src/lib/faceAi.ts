import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

// Polyfill TextEncoder/TextDecoder for browser build of face-api.js
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';

sharp.cache(false);

let MODEL_DIR = path.join(__dirname, '..', '..', 'node_modules', '@vladmandic', 'face-api', 'model');
if (!fs.existsSync(MODEL_DIR)) {
  MODEL_DIR = path.join(process.cwd(), 'node_modules', '@vladmandic', 'face-api', 'model');
}

let modelsLoaded = false;

/**
 * Initializes and loads the face-api models into memory
 */
export const initFaceAi = async () => {
  if (modelsLoaded) return;

  try {
    // Set tfjs backend to WASM for high performance and low memory
    await tf.setBackend('wasm');
    await tf.ready();
    console.log('[FaceAI] TensorFlow.js initialized with backend:', tf.getBackend());

    console.log(`[FaceAI] Loading weights from local folder: ${MODEL_DIR}...`);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR);

    modelsLoaded = true;
    console.log('[FaceAI] All models loaded successfully into memory.');
  } catch (err) {
    console.error('[FaceAI] Failed to initialize face-api:', err);
    throw err;
  }
};

/**
 * Helper to convert sharp image buffer to a 3D tensor
 */
const bufferToTensor = async (imageBuffer: Buffer): Promise<tf.Tensor3D> => {
  // Resize to max 800px width/height before converting to raw buffer
  // This drastically reduces memory usage from 100MB+ to ~2MB per image!
  const { data, info } = await sharp(imageBuffer)
    .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return tf.tensor3d(data, [info.height, info.width, info.channels], 'int32');
};

export interface DetectedFace {
  embedding: number[];
  bbox: [number, number, number, number]; // [top, right, bottom, left]
  thumbnail: string; // base64 jpeg
}

/**
 * Detects all faces in an image buffer and returns their embeddings and thumbnails
 */
export const detectFaces = async (
  imageBuffer: Buffer,
  minConfidence: number = 0.40,
  minFaceSize: number = 30
): Promise<DetectedFace[]> => {
  await initFaceAi();

  let tensor: tf.Tensor3D | null = null;
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    tensor = await bufferToTensor(imageBuffer);

    // Compute coordinate scaling factors (Original image size / Resized tensor size)
    const tensorWidth = tensor.shape[1];
    const tensorHeight = tensor.shape[0];
    const scaleX = width / tensorWidth;
    const scaleY = height / tensorHeight;

    // Run face detection with customizable confidence threshold
    const detections = await faceapi
      .detectAllFaces(tensor as any, new faceapi.SsdMobilenetv1Options({ minConfidence }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faces: DetectedFace[] = [];

    for (const det of detections) {
      const box = det.detection.box;
      
      // Map bounding box to standard [top, right, bottom, left] format using scaling factors
      // Clamp values to original image dimensions
      const top = Math.max(0, Math.floor(box.y * scaleY));
      const left = Math.max(0, Math.floor(box.x * scaleX));
      const bottom = Math.min(height, Math.floor((box.y + box.height) * scaleY));
      const right = Math.min(width, Math.floor((box.x + box.width) * scaleX));

      const cropW = right - left;
      const cropH = bottom - top;

      // Ignore tiny/blurry faces (< minFaceSize) to avoid low-quality false positive embeddings
      if (cropW < minFaceSize || cropH < minFaceSize) {
        continue;
      }

      // Extract embedding descriptor array (128-dimensional for face-api.js)
      const embedding = Array.from(det.descriptor);

      // Create a thumbnail crop of the face
      let thumbnail = '';
      try {
        const faceBuffer = await sharp(imageBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .resize(150, 150)
          .jpeg({ quality: 90 })
          .toBuffer();
        thumbnail = faceBuffer.toString('base64');
      } catch (cropErr) {
        console.error('[FaceAI] Failed to extract face thumbnail crop:', cropErr);
      }

      faces.push({
        embedding,
        bbox: [top, right, bottom, left],
        thumbnail
      });
    }

    return faces;
  } catch (err) {
    console.error('[FaceAI] Error during face detection:', err);
    throw err;
  } finally {
    if (tensor) {
      tensor.dispose();
    }
  }
};
