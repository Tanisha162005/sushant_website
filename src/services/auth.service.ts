import { UserRepository } from '@/repositories/user.repository';
import { generateAndSendOtp, verifyOtp } from '@/lib/otp';
import { generateTokens, setAuthCookies } from '@/lib/jwt';

const userRepo = new UserRepository();

export class AuthService {
  async requestOtp(phone: string) {
    return await generateAndSendOtp(phone);
  }

  async verifyOtpAndLogin(phone: string, otp: string, name?: string, email?: string) {
    const isValid = await verifyOtp(phone, otp);
    if (!isValid) throw new Error('Invalid or expired OTP');

    let user = await userRepo.findByPhone(phone);
    if (!user) {
      if (!name) throw new Error('Name is required for registration');
      user = await userRepo.create({ phone, name, email });
    }

    const tokens = generateTokens({ userId: user.id, role: user.role });
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    
    return user;
  }
}
