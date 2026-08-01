import Razorpay from 'razorpay';

export const razorpay = process.env.WEBSITE_LIVE === 'true'
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
    })
  : ({} as any);
