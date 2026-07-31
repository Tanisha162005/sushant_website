/**
 * Mongoose Connection Utility
 * ===========================
 * Provides a singleton MongoDB connection for the Next.js application.
 *
 * Why this pattern?
 * - Next.js in development mode clears Node.js module cache on every HMR refresh.
 * - Without caching on `globalThis`, every API call would create a new connection.
 * - This utility caches the connection promise on `globalThis` so it survives HMR.
 * - In production, the module cache is stable, so this acts as a simple singleton.
 *
 * Usage:
 *   import { connectToMongoDB } from '@/lib/mongoose';
 *   await connectToMongoDB();
 */

import mongoose from 'mongoose';

/** Extend globalThis to cache the mongoose connection promise */
declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connects to MongoDB using Mongoose.
 * Reuses existing connection if available (connection pooling for Next.js).
 *
 * @returns The mongoose instance after connection is established.
 * @throws Error if MONGODB_URI environment variable is not set.
 */
export async function connectToMongoDB(): Promise<typeof mongoose> {
  // Validate that the environment variable is configured
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Please add it to your .env.local file.'
    );
  }

  // Return cached connection if it exists (prevents multiple connections in dev)
  if (global._mongoosePromise) {
    return global._mongoosePromise;
  }

  // Create a new connection and cache it on globalThis
  global._mongoosePromise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false, // Fail fast if not connected, rather than buffering
  });

  return global._mongoosePromise;
}
