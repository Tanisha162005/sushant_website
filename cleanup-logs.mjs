import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Securely load environment variables without printing them
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

async function cleanupLogs() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[Error] DATABASE_URL is not defined in the environment variables.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
  });

  let client;
  try {
    client = await pool.connect();
    
    // Safely delete only audit_logs older than 24 hours
    const result = await client.query(`
      DELETE FROM audit_logs 
      WHERE created_at < NOW() - INTERVAL '24 hours';
    `);

    console.log(`[Success] User log cleanup completed. Deleted ${result.rowCount} old records.`);
  } catch (error) {
    console.error('[Error] Failed to clean up logs:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

cleanupLogs();
