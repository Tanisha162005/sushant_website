import Razorpay from 'razorpay';

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('[Razorpay] Missing credentials:', {
        key_id: key_id ? `${key_id.slice(0, 8)}...` : 'MISSING',
        key_secret: key_secret ? '***set***' : 'MISSING',
      });
      throw new Error('Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local');
    }

    console.log('[Razorpay] Initializing with key:', key_id.slice(0, 12) + '...');
    _razorpay = new Razorpay({ key_id, key_secret });
  }
  return _razorpay;
}

/** @deprecated Use getRazorpay() instead */
export const razorpay = new Proxy({} as Razorpay, {
  get(_, prop) {
    return (getRazorpay() as unknown as Record<string, unknown>)[prop as string];
  },
});
