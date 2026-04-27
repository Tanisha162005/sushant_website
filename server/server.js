// ===== EXPRESS SERVER WITH SECURITY MIDDLEWARE =====
// Production-ready server for Razorpay payment integration

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const paymentRoutes = require('./routes/payment');
const { getDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Helmet — Secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://checkout.razorpay.com",
                "https://api.razorpay.com",
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com",
            ],
            frameSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com",
            ],
            connectSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://lumberjack.razorpay.com",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://checkout.razorpay.com",
                "https://cdn.tailwindcss.com",
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
            ],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// 2. CORS — Only allow your domain (configure in production)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || 'https://yourdomain.com'
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
};
app.use(cors(corsOptions));

// 3. Rate Limiting — Prevent abuse
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window per IP
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(generalLimiter);

// Stricter rate limit for payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 payment attempts per window per IP
    message: { success: false, message: 'Too many payment attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. HTTPS Redirect (production only)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// 5. Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATIC FILES — Serve the frontend
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Block access to sensitive files/directories
app.use((req, res, next) => {
    const blocked = ['/server', '/node_modules', '/.env', '/.git', '/package', '/merge.js', '/payments.db'];
    const lower = req.path.toLowerCase();
    if (blocked.some(b => lower.startsWith(b))) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }
    next();
});

app.use(express.static(path.join(__dirname, '..'), {
    extensions: ['html'],
    index: 'index.html',
}));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use('/api', paymentLimiter);
app.use('/api', paymentRoutes);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Initialize database on startup
getDatabase();

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💰 Course Price: ₹${(parseInt(process.env.COURSE_PRICE_PAISE, 10) / 100).toLocaleString('en-IN')}\n`);
});

module.exports = app;
