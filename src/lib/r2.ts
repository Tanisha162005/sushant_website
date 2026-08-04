import { S3Client } from '@aws-sdk/client-s3';

let client: S3Client | null = null;

function getRequiredEnv() {
  const env = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
  };

  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `[R2] Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return env;
}

export function getR2Client(): S3Client {
  if (client) {
    return client;
  }

  const env = getRequiredEnv();

  client = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}

export function getR2BucketName(): string {
  return getRequiredEnv().R2_BUCKET_NAME!;
}

export function getR2AccountId(): string {
  return getRequiredEnv().R2_ACCOUNT_ID!;
}
