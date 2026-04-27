// ===== PAYMENT API ROUTES =====
// Handles order creation, signature verification, and webhooks

const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const razorpay = require('../config/razorpay');
const { getStatements } = require('../config/database');

const router = express.Router();

// ─── Validation rules ───
const orderValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone is required')
        .matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
];

const verifyValidation = [
    body('razorpay_order_id')
        .trim()
        .notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id')
        .trim()
        .notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature')
        .trim()
        .notEmpty().withMessage('Signature is required'),
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. CREATE ORDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/create-order', orderValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(e => e.msg),
            });
        }

        const { name, email, phone } = req.body;

        // ⚠️ CRITICAL: Amount is ALWAYS from server — never trust frontend
        const amount = parseInt(process.env.COURSE_PRICE_PAISE, 10);
        if (!amount || amount <= 0) {
            console.error('❌ Invalid COURSE_PRICE_PAISE in .env');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        const currency = 'INR';

        // Create Razorpay order
        const options = {
            amount: amount,
            currency: currency,
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            notes: {
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                course: 'Content Creation Master Course',
            },
        };

        const order = await razorpay.orders.create(options);

        // Store pending transaction in database
        const stmts = getStatements();
        stmts.insertTransaction.run({
            order_id: order.id,
            user_name: name,
            user_email: email,
            user_phone: phone,
            amount: amount,
            currency: currency,
            status: 'created',
        });

        console.log(`📦 Order created: ${order.id} for ${email}`);

        // Return order details to frontend (key_id only, NOT secret)
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('❌ Order creation failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order. Please try again.',
        });
    }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. VERIFY PAYMENT SIGNATURE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/verify-payment', verifyValidation, (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(e => e.msg),
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // HMAC SHA256 signature verification
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const isSignatureValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(razorpay_signature, 'hex')
        );

        if (!isSignatureValid) {
            console.warn(`⚠️ Signature verification FAILED for order: ${razorpay_order_id}`);
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Signature mismatch.',
            });
        }

        // Update transaction in database
        const stmts = getStatements();
        stmts.updateTransactionPayment.run({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            status: 'captured',
            method: 'razorpay',
        });

        console.log(`✅ Payment verified: ${razorpay_payment_id} for order ${razorpay_order_id}`);

        res.json({
            success: true,
            message: 'Payment verified successfully!',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
        });

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed. Please contact support.',
        });
    }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. RAZORPAY WEBHOOK HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/webhook', (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ success: false, message: 'Webhook not configured' });
        }

        // Verify webhook signature
        const receivedSignature = req.headers['x-razorpay-signature'];

        if (!receivedSignature) {
            console.warn('⚠️ Webhook received without signature header');
            return res.status(400).json({ success: false, message: 'Missing signature' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(receivedSignature, 'hex')
        );

        if (!isValid) {
            console.warn('⚠️ Webhook signature verification FAILED');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // Process webhook event
        const event = req.body.event;
        const payload = req.body.payload;
        const stmts = getStatements();

        let orderId = null;
        let paymentId = null;

        // Extract IDs based on event type
        if (payload && payload.payment && payload.payment.entity) {
            paymentId = payload.payment.entity.id;
            orderId = payload.payment.entity.order_id;
        }
        if (payload && payload.order && payload.order.entity) {
            orderId = orderId || payload.order.entity.id;
        }

        // Log webhook event
        stmts.insertWebhookLog.run({
            event_type: event,
            order_id: orderId,
            payment_id: paymentId,
            payload: JSON.stringify(req.body),
            verified: 1,
        });

        // Handle specific events
        switch (event) {
            case 'payment.captured':
                console.log(`🔔 Webhook: payment.captured for order ${orderId}`);
                if (orderId) {
                    stmts.updateTransactionStatus.run({
                        order_id: orderId,
                        status: 'captured',
                    });
                }
                break;

            case 'payment.failed':
                console.log(`🔔 Webhook: payment.failed for order ${orderId}`);
                if (orderId) {
                    stmts.updateTransactionStatus.run({
                        order_id: orderId,
                        status: 'failed',
                    });
                }
                break;

            case 'order.paid':
                console.log(`🔔 Webhook: order.paid for order ${orderId}`);
                if (orderId) {
                    stmts.updateTransactionStatus.run({
                        order_id: orderId,
                        status: 'paid',
                    });
                }
                break;

            default:
                console.log(`🔔 Webhook: unhandled event "${event}"`);
        }

        // Always respond 200 to Razorpay (otherwise it retries)
        res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        // Still return 200 to prevent Razorpay retries for processing errors
        res.status(200).json({ success: true, message: 'Webhook received' });
    }
});

module.exports = router;
