import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Check if Razorpay returned an error in the redirect
    const errorDescription = formData.get('error[description]');
    if (errorDescription) {
      logger.warn('[PaymentCallback] Razorpay returned an error:', errorDescription);
      return NextResponse.redirect(new URL('/dashboard?error=' + encodeURIComponent(errorDescription as string), req.url));
    }

    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.error('[PaymentCallback] Missing payment verification fields in redirect');
      return NextResponse.redirect(new URL('/dashboard?error=missing_fields', req.url));
    }

    // Authenticate the user session from cookies (available during standard browser form POST)
    const token = req.cookies.get('user_token')?.value || req.cookies.get('accessToken')?.value;
    if (!token) {
      logger.error('[PaymentCallback] User token missing in redirect request');
      return NextResponse.redirect(new URL('/login?redirect=/dashboard', req.url));
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
      if (!userId) throw new Error('Invalid userId in token');
    } catch {
      logger.error('[PaymentCallback] JWT verification failed in redirect request');
      return NextResponse.redirect(new URL('/login?redirect=/dashboard', req.url));
    }

    // Verify the Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      logger.error('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.redirect(new URL('/dashboard?error=server_error', req.url));
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn('[PaymentCallback] Invalid signature during redirect verification', { razorpay_order_id, razorpay_payment_id });
      return NextResponse.redirect(new URL('/dashboard?error=invalid_signature', req.url));
    }

    // Verify order ownership
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (existingPayment.length === 0) {
      logger.warn('[PaymentCallback] No payment record found for order', { razorpay_order_id });
      return NextResponse.redirect(new URL('/dashboard?error=order_not_found', req.url));
    }

    if (existingPayment[0].userId !== userId) {
      logger.warn('[PaymentCallback] Ownership mismatch during redirect verification', { razorpay_order_id, userId });
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
    }

    // Update the payment record securely in the database
    const result = await db
      .update(payments)
      .set({
        status: 'successful',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      })
      .where(eq(payments.razorpayOrderId, razorpay_order_id))
      .returning();

    if (result.length === 0) {
      logger.error('[PaymentCallback] Payment record update failed');
      return NextResponse.redirect(new URL('/dashboard?error=update_failed', req.url));
    }

    logger.info('[PaymentCallback] Payment verified successfully via mobile redirect fallback', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Success! Redirect user directly to their downloads with a success parameter to trigger UI updates if necessary
    return NextResponse.redirect(new URL('/dashboard?tab=downloads&payment_success=true', req.url));

  } catch (error) {
    logger.error('[PaymentCallback] Error processing Razorpay redirect callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', req.url));
  }
}
