import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

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

    // Verify the Razorpay signature (SERVER-SIDE ONLY)
    // We use RAZORPAY_KEY_SECRET for Checkout signatures.
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

    // Find existing payment safely
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (existingPayment.length === 0) {
      logger.warn('[PaymentCallback] No payment record found for order. Cannot grant access to unknown order.', { razorpay_order_id });
      return NextResponse.redirect(new URL('/dashboard?error=order_not_found', req.url));
    }

    const paymentRecord = existingPayment[0];

    // Idempotent: If it's already successful, just redirect
    if (paymentRecord.status === 'successful') {
      logger.info('[PaymentCallback] Payment already marked as successful (Idempotent)', { razorpay_order_id });
      return NextResponse.redirect(new URL('/dashboard?tab=downloads&payment_success=true', req.url));
    }

    // Update ONLY the existing payment securely
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

    logger.info('[PaymentCallback] Payment verified successfully via callback', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    return NextResponse.redirect(new URL('/dashboard?tab=downloads&payment_success=true', req.url));

  } catch (error) {
    logger.error('[PaymentCallback] Error processing Razorpay callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', req.url));
  }
}
