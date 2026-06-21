import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

dotenv.config();

const isMock = !process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('mock');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

if (isMock) {
  r2Client.send = (async (command: any): Promise<any> => {
    const input = command.input;
    const key = input.Key;
    const localPath = path.join(process.cwd(), 'uploads', key);
    const cmdName = command.constructor.name;

    if (cmdName === 'PutObjectCommand') {
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, input.Body);
      return { $metadata: { httpStatusCode: 200 } };
    }

    if (cmdName === 'GetObjectCommand') {
      if (!fs.existsSync(localPath)) {
        throw new Error(`Mock file not found: ${localPath}`);
      }
      const buffer = fs.readFileSync(localPath);
      const stream = Readable.from(buffer);
      return {
        Body: stream,
        $metadata: { httpStatusCode: 200 }
      };
    }

    if (cmdName === 'DeleteObjectCommand') {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      return { $metadata: { httpStatusCode: 200 } };
    }

    throw new Error(`Mock command not supported: ${cmdName}`);
  }) as any;
}

const bucketName = process.env.R2_BUCKET_NAME || 'mara-photo';

/**
 * Uploads a buffer directly to Cloudflare R2 or local fallback
 */
export const uploadToR2 = async (fileBuffer: Buffer, key: string, contentType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  
  await r2Client.send(command);
  
  if (isMock) {
    return `http://localhost:5000/uploads/${key}`;
  }
  return `${process.env.R2_ENDPOINT}/${bucketName}/${key}`;
};

/**
 * Generates a presigned read URL valid for a given duration
 */
export const getPresignedUrl = async (key: string, expiresInSeconds = 3600): Promise<string> => {
  if (isMock) {
    return `http://localhost:5000/uploads/${key}`;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Deletes an object from Cloudflare R2 or local fallback
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await r2Client.send(command);
};
export { r2Client };
