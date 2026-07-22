import { db } from '@/db';
import { payments, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';

import { MOCK_COURSES } from '@/lib/mockDb';

export class PaymentService {
  async createOrder(userId: string, courseId: string) {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');
    
    const amount = course.price;

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };
    
    // Fallback if Razorpay is not configured for presentation
    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch {
      order = { id: `mock_order_${new Date().getTime()}`, amount, currency: 'INR' };
    }

    const paymentRecord = {
      id: `mock_pay_${new Date().getTime()}`,
      userId,
      courseId,
      amount,
      razorpayOrderId: order.id,
      status: 'created',
    };

    return { order, paymentRecord };
  }

  async verifyWebhook(body: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
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
