/**
 * Subscribe API Route
 * ===================
 * POST /api/subscribe
 *
 * Accepts an email address and optional language preference,
 * validates the input, and saves the subscriber to MongoDB.
 *
 * Request Body:
 *   { email: string, language?: "en" | "mr" }
 *
 * Responses:
 *   201 — Subscription successful
 *   400 — Invalid email or missing fields
 *   409 — Email already subscribed (friendly, not an error)
 *   500 — Server error (database connection failure, etc.)
 *
 * This route does NOT send any emails. Email marketing is handled
 * externally via platforms like Brevo/Mailchimp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongoose';
import Subscriber from '@/models/Subscriber';

/** Simple email validation regex (RFC 5322 simplified) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Allowed language values */
const VALID_LANGUAGES = ['en', 'mr'] as const;

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, language = 'en' } = body;

    // --- Validation ---

    // Check that email is provided and is a string
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Validate language field
    if (!VALID_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { success: false, message: 'Invalid language. Use "en" or "mr".' },
        { status: 400 }
      );
    }

    // --- Database Operations ---

    // Connect to MongoDB (reuses existing connection if available)
    await connectToMongoDB();

    // Check if email already exists to provide a friendly duplicate message
    const existingSubscriber = await Subscriber.findOne({ email: trimmedEmail });

    if (existingSubscriber) {
      return NextResponse.json(
        {
          success: false,
          message:
            language === 'mr'
              ? 'तुम्ही आधीच नोंदणी केली आहे!'
              : "You're already subscribed!",
        },
        { status: 409 }
      );
    }

    // Create and save the new subscriber
    await Subscriber.create({
      email: trimmedEmail,
      language,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          language === 'mr'
            ? 'धन्यवाद! तुमची नोंदणी यशस्वीरित्या झाली.'
            : "Thank you! You're on the list.",
      },
      { status: 201 }
    );
  } catch (error) {
    // Log the error for debugging (visible in server logs)
    console.error('[Subscribe API Error]:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}
