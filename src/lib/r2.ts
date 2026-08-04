import { S3Client } from '@aws-sdk/client-s3';

// Validate required environment variables at import time
const requiredEnvVars = {
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
} as const;

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `[R2] Missing required environment variables: ${missingVars.join(', ')}. ` +
    `Ensure these are set in .env.local.`
  );
}

/**
 * Singleton Cloudflare R2 client using AWS SDK v3.
 * Configured via environment variables set in .env.local.
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: requiredEnvVars.R2_ENDPOINT!,
  credentials: {
    accessKeyId: requiredEnvVars.R2_ACCESS_KEY_ID!,
    secretAccessKey: requiredEnvVars.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET_NAME = requiredEnvVars.R2_BUCKET_NAME!;
export const R2_ACCOUNT_ID = requiredEnvVars.R2_ACCOUNT_ID!;
