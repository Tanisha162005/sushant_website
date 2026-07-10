import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { handleApiError } from '@/lib/api-error';

const paymentService = new PaymentService();

export class PaymentController {
  static async createOrder(req: NextRequest) {
    try {
      const { userId, courseId } = await req.json();
      const result = await paymentService.createOrder(userId, courseId);
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }

  static async webhook(req: NextRequest) {
    try {
      const signature = req.headers.get('x-razorpay-signature');
      if (!signature) throw new Error('Missing signature');

      const body = await req.text();
      await paymentService.verifyWebhook(body, signature);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }
}
