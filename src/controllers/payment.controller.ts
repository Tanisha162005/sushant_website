import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { handleApiError } from '@/lib/api-error';
import { jwtVerify } from 'jose';

const paymentService = new PaymentService();

export class PaymentController {
  static async createOrder(req: NextRequest) {
    try {
      const token = req.cookies.get('user_token')?.value || req.cookies.get('accessToken')?.value;
      if (!token) {
        return NextResponse.json({ success: false, message: 'Unauthorized: Authentication required to create orders' }, { status: 401 });
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      let userId: string;
      try {
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
        if (!userId) throw new Error('No user ID in token payload');
      } catch {
        return NextResponse.json({ success: false, message: 'Unauthorized: Invalid authentication session' }, { status: 401 });
      }

      const { courseId, clientAmount } = await req.json();
      if (!courseId) {
        return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
      }

      // Derive authenticated user exclusively from verified JWT session
      const result = await paymentService.createOrder(userId, courseId, clientAmount);
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      return NextResponse.json({ success: true, ...result, keyId }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }

  static async webhook(req: NextRequest) {
    try {
      const signature = req.headers.get('x-razorpay-signature');
      const eventId = req.headers.get('x-razorpay-event-id') || undefined;
      
      if (!signature) throw new Error('Missing signature');

      const body = await req.text();
      await paymentService.verifyWebhook(body, signature, eventId);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }
}
