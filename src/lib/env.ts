import { logger } from './logger';

const requiredEnvVars = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'JWT_SECRET',
  'R2_BUCKET_NAME',
  'R2_REGION',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
];

export function validateEnvironment(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    const value = process.env[key] || process.env[key.replace('_ID', '')] || process.env[key.replace('R2_BUCKET_NAME', 'R2_BUCKET')];
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Startup Configuration Error] Missing required production environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    } else {
      logger.warn(`[Dev Mode Warning] Running without production env vars: ${missing.join(', ')}`);
    }
  } else {
    logger.info('[Environment Validation] All required production environment variables verified.');
  }
}
