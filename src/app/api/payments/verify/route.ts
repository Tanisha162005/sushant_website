import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value || req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Authentication required for payment verification' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
      if (!userId) throw new Error('Invalid userId in token');
    } catch {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid authentication session' },
        { status: 401 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    // Verify the Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      logger.error('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { success: false, message: 'Payment verification not configured' },
        { status: 500 }
      );
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn('[PaymentVerify] Invalid signature', { razorpay_order_id, razorpay_payment_id });
      return NextResponse.json(
        { success: false, message: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // Verify order ownership before updating and disclosing payment information
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (existingPayment.length === 0) {
      logger.warn('[PaymentVerify] No payment record found for order', { razorpay_order_id });
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (existingPayment[0].userId !== userId) {
      logger.warn('[PaymentVerify] Ownership mismatch during verification', { razorpay_order_id, userId });
      return NextResponse.json(
        { success: false, message: 'Forbidden: You are not authorized to verify or access this payment' },
        { status: 403 }
      );
    }

    // Update the payment record in the database
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
      return NextResponse.json(
        { success: false, message: 'Payment record update failed' },
        { status: 500 }
      );
    }

    logger.info('[PaymentVerify] Payment verified successfully', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: result[0],
    });
  } catch (error) {
    logger.error('[PaymentVerify] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
