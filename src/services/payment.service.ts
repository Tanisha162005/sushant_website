import { db } from '@/db';
import { payments, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export class PaymentService {
  async createOrder(userId: string, courseId: string, clientAmount?: number) {
    if (!clientAmount || clientAmount < 100) throw new Error('Invalid amount provided.');

    // Razorpay has a strict 40-character maximum limit on receipt ID
    const receipt = `rcpt_${Date.now().toString(36)}_${courseId.slice(-8)}`;

    const options = {
      amount: clientAmount,
      currency: 'INR',
      receipt,
    };
    
    // Parallelize Razorpay order creation and DB course lookup
    const orderPromise = razorpay.orders.create(options).catch(err => {
      const rzErr = err as Record<string, unknown>;
      const errObj = rzErr?.error as Record<string, unknown> | undefined;
      const errorDetail = errObj?.description || errObj?.message || rzErr?.description || rzErr?.message || (typeof err === 'string' ? err : 'Failed to create payment order.');
      logger.error('[PaymentService] Razorpay order creation failed:', err);
      throw new Error(`Razorpay Error: ${errorDetail}`);
    });

    const coursePromise = db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    const [order, courseRecords] = await Promise.all([orderPromise, coursePromise]);
    const course = courseRecords[0];
    
    if (!course) throw new Error('Course not found');
    if (course.price !== clientAmount) throw new Error('Price mismatch detected. Please refresh the page and try again.');

    // Always persist payment record in DB before returning to client
    try {
      await db.insert(payments).values({
        userId,
        courseId,
        amount: course.price,
        razorpayOrderId: order.id,
        status: 'created',
      });
    } catch (dbErr) {
      logger.error('[PaymentService] Failed to insert payment record in DB:', dbErr);
      throw new Error('Failed to save payment record. Please try again.');
    }

    return { order };
  }

  async verifyWebhook(body: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('[Webhook] Invalid signature');
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    
    if (event === 'payment.captured' || event === 'order.paid' || event === 'payment.failed') {
      const paymentEntity = event === 'order.paid' ? payload.payload.order.entity : payload.payload.payment.entity;
      const orderId = event === 'order.paid' ? paymentEntity.id : paymentEntity.order_id;
      const paymentId = event === 'payment.captured' || event === 'payment.failed' ? paymentEntity.id : undefined;

      const existingPaymentList = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, orderId))
        .limit(1);

      if (existingPaymentList.length === 0) {
        logger.warn('[Webhook] Order not found in DB, rejecting', { orderId });
        return true; // Return 200 so Razorpay stops retrying unknown orders
      }

      const existingPayment = existingPaymentList[0];

      if (existingPayment.status === 'successful') {
        logger.info('[Webhook] Payment already successful (Idempotent)', { orderId });
        return true;
      }

      if (event === 'payment.failed') {
        await db.update(payments)
          .set({ status: 'failed' })
          .where(eq(payments.razorpayOrderId, orderId));
        return true;
      }

      // If captured or paid, update to successful
      await db.update(payments)
        .set({ 
          status: 'successful', 
          ...(paymentId ? { razorpayPaymentId: paymentId } : {})
        })
        .where(eq(payments.razorpayOrderId, orderId));
        
      logger.info('[Webhook] Payment successfully verified and updated', { orderId, paymentId });
    }
    
    return true;
  }
}
