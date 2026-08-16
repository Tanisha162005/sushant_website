import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

async function checkDatabaseState() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[Error] DATABASE_URL is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('[Success] Connection to PostgreSQL established securely.');

    // 1. Check if migration 0005_shocking_slayback is recorded
    try {
      const migrationRes = await client.query(`
        SELECT count(*) as count 
        FROM "drizzle"."__drizzle_migrations" 
        WHERE "id" = (
          SELECT MAX("id") 
          FROM "drizzle"."__drizzle_migrations"
        ) AND "hash" LIKE '%0005_shocking_slayback%';
      `);
      // Wait, Drizzle migrations table stores filename or hash?
      // Usually it stores 'id', 'hash', 'created_at'.
      // Better to check just the hash or existence if possible.
      // Drizzle typically does not store the filename in `__drizzle_migrations`. It stores `id`, `hash`, `created_at`.
      // Let's just check if index exists first.
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Checking migration specifically might be tricky without knowing Drizzle's exact meta table structure for this project.
    // Let's just dump all rows from __drizzle_migrations safely.
    let isMigrationRecorded = false;
    try {
      const allMigrations = await client.query(`SELECT * FROM "drizzle"."__drizzle_migrations"`);
      // Drizzle usually tracks migrations in `drizzle.__drizzle_migrations`
      // Wait, let's just log the count or if we see 0005 in any column.
      isMigrationRecorded = JSON.stringify(allMigrations.rows).includes('0005_shocking_slayback');
      console.log(`[Info] Found ${allMigrations.rowCount} total migrations recorded.`);
    } catch (e) {
      console.log('[Warn] Could not read drizzle.__drizzle_migrations table.');
    }

    console.log(`[Status] Migration 0005_shocking_slayback recorded: ${isMigrationRecorded}`);

    // 2. Check if index audit_logs_created_at_idx exists
    const indexRes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename = 'audit_logs'
        AND indexname = 'audit_logs_created_at_idx';
    `);
    
    const indexExists = indexRes.rowCount > 0;
    console.log(`[Status] Index audit_logs_created_at_idx exists: ${indexExists}`);

  } catch (error) {
    console.error('[Error] Failed to connect or query:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabaseState();
