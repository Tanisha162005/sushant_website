// ===== SQLITE DATABASE SETUP =====
// Stores transaction records and webhook event logs

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'payments.db');

let db;

function getDatabase() {
    if (!db) {
        db = new Database(DB_PATH);

        // Enable WAL mode for better concurrent read performance
        db.pragma('journal_mode = WAL');

        // Create tables if they don't exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id        TEXT UNIQUE NOT NULL,
                payment_id      TEXT,
                user_name       TEXT NOT NULL,
                user_email      TEXT NOT NULL,
                user_phone      TEXT,
                amount          INTEGER NOT NULL,
                currency        TEXT DEFAULT 'INR',
                status          TEXT DEFAULT 'created',
                method          TEXT,
                razorpay_signature TEXT,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS webhook_logs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type      TEXT NOT NULL,
                order_id        TEXT,
                payment_id      TEXT,
                payload         TEXT,
                verified        INTEGER DEFAULT 0,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(user_email);
            CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
        `);

        console.log('✅ Database initialized at', DB_PATH);
    }
    return db;
}

// Prepared statements for performance
function getStatements() {
    const database = getDatabase();

    return {
        insertTransaction: database.prepare(`
            INSERT INTO transactions (order_id, user_name, user_email, user_phone, amount, currency, status)
            VALUES (@order_id, @user_name, @user_email, @user_phone, @amount, @currency, @status)
        `),

        updateTransactionPayment: database.prepare(`
            UPDATE transactions
            SET payment_id = @payment_id,
                razorpay_signature = @razorpay_signature,
                status = @status,
                method = @method,
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = @order_id
        `),

        updateTransactionStatus: database.prepare(`
            UPDATE transactions
            SET status = @status,
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = @order_id
        `),

        getTransactionByOrderId: database.prepare(`
            SELECT * FROM transactions WHERE order_id = ?
        `),

        getTransactionByPaymentId: database.prepare(`
            SELECT * FROM transactions WHERE payment_id = ?
        `),

        insertWebhookLog: database.prepare(`
            INSERT INTO webhook_logs (event_type, order_id, payment_id, payload, verified)
            VALUES (@event_type, @order_id, @payment_id, @payload, @verified)
        `),
    };
}

module.exports = { getDatabase, getStatements };
