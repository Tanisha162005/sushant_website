import otpGenerator from 'otp-generator';
import { redis } from './redis';
import { logger } from './logger';

const OTP_EXPIRY = 300; // 5 minutes

export const generateAndSendOtp = async (phone: string): Promise<string> => {
  const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  
  // Store OTP in Redis
  await redis.setex(`otp:${phone}`, OTP_EXPIRY, otp);
  
  // In production, integrate with MSG91 or Twilio here
  logger.info(`Sending OTP ${otp} to phone ${phone}`);
  
  // Return OTP only in dev environment for testing, in prod return success true
  return process.env.NODE_ENV === 'development' ? otp : 'OTP sent successfully';
};

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  const storedOtp = await redis.get(`otp:${phone}`);
  
  if (storedOtp && storedOtp === otp) {
    await redis.del(`otp:${phone}`); // Delete OTP after successful verification
    return true;
  }
  
  return false;
};
