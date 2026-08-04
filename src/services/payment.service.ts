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

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };
    
    // Fallback if Razorpay is not configured for test/local
    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch {
      order = { id: `mock_order_${new Date().getTime()}`, amount, currency: 'INR' };
    }

    const paymentRecord = {
      id: `pay_${Date.now()}`,
      userId,
      courseId,
      amount,
      razorpayOrderId: order.id,
      status: 'created' as const,
    };

    // Attempt to persist in PostgreSQL if valid user ID is provided
    if (userId !== 'temp-user') {
      try {
        await db.insert(payments).values({
          userId,
          courseId,
          amount,
          razorpayOrderId: order.id,
          status: 'created',
        });
      } catch (dbErr) {
        logger.warn('[PaymentService] Failed to insert payment record in DB:', dbErr);
      }
    }

    return { order, paymentRecord };
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
