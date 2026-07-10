import { NextRequest, NextResponse } from 'next/server';
import { requestOtpSchema, verifyOtpSchema } from '@/lib/validations';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/api-error';
import { rateLimit } from '@/lib/rate-limit';

const authService = new AuthService();

export class AuthController {
  static async requestOtp(req: NextRequest) {
    try {
      // Rate limiting: max 5 requests per 15 minutes per IP
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const rl = await rateLimit(`otp-req:${ip}`, 5, 900);
      if (!rl.success) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });

      const body = await req.json();
      const parsed = requestOtpSchema.parse(body);
      
      const otpInfo = await authService.requestOtp(parsed.phone);
      return NextResponse.json({ success: true, message: 'OTP sent', data: otpInfo }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }

  static async verifyOtp(req: NextRequest) {
    try {
      const body = await req.json();
      const parsed = verifyOtpSchema.parse(body);
      
      const user = await authService.verifyOtpAndLogin(parsed.phone, parsed.otp, parsed.name, parsed.email);
      return NextResponse.json({ success: true, user }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }
}
