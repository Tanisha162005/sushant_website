/**
 * Subscriber Model
 * ================
 * Mongoose model for storing email subscribers from the Coming Soon page.
 *
 * Schema:
 *   - email:     The subscriber's email address (unique, lowercase, trimmed)
 *   - language:  The language the user was viewing when they subscribed ("en" or "mr")
 *   - createdAt: Automatically set by Mongoose timestamps
 *
 * Notes:
 *   - The `email` field has a unique index to prevent duplicate subscriptions.
 *   - The model is cached via `mongoose.models` to prevent re-compilation
 *     during Next.js HMR in development.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/** TypeScript interface for a Subscriber document */
export interface ISubscriber extends Document {
  email: string;
  language: 'en' | 'mr';
  createdAt: Date;
}

/** Mongoose schema definition for Subscriber */
const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,   // Normalize to lowercase for deduplication
      trim: true,         // Remove leading/trailing whitespace
    },
    language: {
      type: String,
      enum: ['en', 'mr'],
      default: 'en',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  }
);

/**
 * Export the Subscriber model.
 * Uses `mongoose.models.Subscriber` if it already exists (HMR safety),
 * otherwise compiles a new model from the schema.
 */
const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
