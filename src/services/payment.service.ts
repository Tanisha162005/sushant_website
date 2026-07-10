import { db } from '@/db';
import { payments, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';

export class PaymentService {
  async createOrder(userId: string, courseId: string) {
    const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course[0]) throw new Error('Course not found');
    
    const amount = course[0].price;

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };
    
    const order = await razorpay.orders.create(options);

    const paymentRecord = await db.insert(payments).values({
      userId,
      courseId,
      amount,
      razorpayOrderId: order.id,
      status: 'created',
    }).returning();

    return { order, paymentRecord: paymentRecord[0] };
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
