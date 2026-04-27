// ===== RAZORPAY SDK CONFIGURATION =====
// Secret key is loaded from environment variables — NEVER exposed to frontend

const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
    process.exit(1);
}

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
