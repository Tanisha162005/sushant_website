import { db } from '@/db';
import { payments, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export class PaymentService {
  async createOrder(userId: string, courseId: string) {
    // Look up course in PostgreSQL
    const courseRecords = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    const course = courseRecords[0];
    
    if (!course) throw new Error('Course not found');
    
    const amount = course.price;
    if (amount < 100) throw new Error('Amount must be at least 100 paise');

    // Razorpay has a strict 40-character maximum limit on receipt ID
    const receipt = `rcpt_${Date.now().toString(36)}_${courseId.slice(-8)}`;

    const options = {
      amount,
      currency: 'INR',
      receipt,
    };
    
    // Create Razorpay order
    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (err) {
      const rzErr = err as Record<string, unknown>;
      const errObj = rzErr?.error as Record<string, unknown> | undefined;
      const errorDetail = errObj?.description || errObj?.message || rzErr?.description || rzErr?.message || (typeof err === 'string' ? err : 'Failed to create payment order.');
      logger.error('[PaymentService] Razorpay order creation failed:', err);
      throw new Error(`Razorpay Error: ${errorDetail}`);
    }

    // Always persist payment record in DB
    try {
      await db.insert(payments).values({
        userId,
        courseId,
        amount,
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
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(body);
    
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      await db.update(payments)
        .set({ status: 'successful', razorpayPaymentId: paymentId })
        .where(eq(payments.razorpayOrderId, orderId));
    }
    
    return true;
  }
}
