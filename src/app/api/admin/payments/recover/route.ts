import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id } = body;

    if (!razorpay_order_id || typeof razorpay_order_id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid razorpay_order_id' }, { status: 400 });
    }

    // 1. Find existing payment in database
    const existingPaymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (existingPaymentList.length === 0) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    const existingPayment = existingPaymentList[0];

    // Idempotent shortcut
    if (existingPayment.status === 'successful') {
      return NextResponse.json({ success: true, message: 'Payment is already successful' }, { status: 200 });
    }

    if (existingPayment.status !== 'created') {
      return NextResponse.json({ error: `Cannot recover payment in status: ${existingPayment.status}` }, { status: 400 });
    }

    // 4. Query Razorpay API
    const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!rzpKeyId || !rzpKeySecret) {
      logger.error('[Recovery] Razorpay credentials missing');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const authString = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
    
    // 5. Fetch all payments associated with that Razorpay order
    const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}/payments`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (!rzpRes.ok) {
      logger.error('[Recovery] Failed to fetch order payments from Razorpay', { status: rzpRes.status });
      return NextResponse.json({ error: 'Failed to verify with Razorpay' }, { status: 502 });
    }

    const rzpData = await rzpRes.json();
    const orderPayments: any[] = rzpData.items || [];

    // 6. Find the payment whose order_id matches and is captured
    const capturedPayment = orderPayments.find(p => p.status === 'captured');

    if (!capturedPayment) {
      return NextResponse.json({ error: 'No captured payment found for this order on Razorpay' }, { status: 400 });
    }

    // 7, 8, 9. Require matching amounts and order IDs
    if (capturedPayment.order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Razorpay order ID mismatch' }, { status: 400 });
    }

    if (capturedPayment.amount !== existingPayment.amount) {
      return NextResponse.json({ error: 'Amount mismatch between Razorpay and Database' }, { status: 400 });
    }

    // 10. Safely reconcile database to successful
    await db
      .update(payments)
      .set({
        status: 'successful',
        razorpayPaymentId: capturedPayment.id,
      })
      .where(and(
        eq(payments.razorpayOrderId, razorpay_order_id),
        eq(payments.status, 'created') // Conditional update to prevent race conditions
      ));

    logger.info('[Recovery] Payment safely recovered', {
      orderId: razorpay_order_id,
      paymentId: capturedPayment.id,
      amount: capturedPayment.amount
    });

    return NextResponse.json({ success: true, message: 'Payment safely recovered and marked successful' }, { status: 200 });

  } catch (error) {
    logger.error('[Recovery] Error during payment recovery', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
