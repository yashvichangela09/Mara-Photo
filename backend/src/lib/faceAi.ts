import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';

const MODEL_DIR = path.join(process.cwd(), 'face-models');
const MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

const CDN_BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;

/**
 * Downloads model files from CDN if they do not exist locally
 */
export const downloadModelsIfMissing = async () => {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  console.log(`[FaceAI] Checking face-api.js models in: ${MODEL_DIR}`);

  for (const file of MODEL_FILES) {
    const filePath = path.join(MODEL_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`[FaceAI] Downloading missing model file: ${file}...`);
      try {
        const response = await axios.get(`${CDN_BASE_URL}/${file}`, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, Buffer.from(response.data));
      } catch (err: any) {
        console.error(`[FaceAI] Error downloading ${file}:`, err.message);
        throw err;
      }
    }
  }
  console.log('[FaceAI] All model files are present locally.');
};

/**
 * Initializes and loads the face-api models into memory
 */
export const initFaceAi = async () => {
  if (modelsLoaded) return;

  try {
    // Set tfjs backend to CPU for compatibility on serverless environments
    await tf.setBackend('cpu');
    await tf.ready();
    console.log('[FaceAI] TensorFlow.js initialized with backend:', tf.getBackend());

    await downloadModelsIfMissing();

    console.log('[FaceAI] Loading weights from disk...');
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
  const { data, info } = await sharp(imageBuffer)
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
export const detectFaces = async (imageBuffer: Buffer): Promise<DetectedFace[]> => {
  await initFaceAi();

  let tensor: tf.Tensor3D | null = null;
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    tensor = await bufferToTensor(imageBuffer);

    // Run face detection
    const detections = await faceapi
      .detectAllFaces(tensor as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faces: DetectedFace[] = [];

    for (const det of detections) {
      const box = det.detection.box;
      
      // Map bounding box to standard [top, right, bottom, left] format
      // Clamp values to image dimensions
      const top = Math.max(0, Math.floor(box.y));
      const left = Math.max(0, Math.floor(box.x));
      const bottom = Math.min(height, Math.floor(box.y + box.height));
      const right = Math.min(width, Math.floor(box.x + box.width));

      // Extract embedding descriptor array (128-dimensional for face-api.js)
      const embedding = Array.from(det.descriptor);

      // Create a thumbnail crop of the face
      let thumbnail = '';
      try {
        const cropW = right - left;
        const cropH = bottom - top;
        if (cropW > 0 && cropH > 0) {
          const faceBuffer = await sharp(imageBuffer)
            .extract({ left, top, width: cropW, height: cropH })
            .resize(150, 150)
            .jpeg({ quality: 90 })
            .toBuffer();
          thumbnail = faceBuffer.toString('base64');
        }
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
