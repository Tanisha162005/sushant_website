import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

async function applyIndex() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[Error] DATABASE_URL is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    // 1. Verify audit_logs exists
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);
    const tableExists = tableRes.rows[0].exists;
    console.log(`[Status] audit_logs table exists: ${tableExists}`);

    if (!tableExists) throw new Error('audit_logs table does not exist. Aborting.');

    // 2. Verify created_at exists
    const columnRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'created_at'
      );
    `);
    const columnExists = columnRes.rows[0].exists;
    console.log(`[Status] audit_logs.created_at exists: ${columnExists}`);

    if (!columnExists) throw new Error('created_at column does not exist. Aborting.');

    // 3. Verify index does not already exist
    const indexRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'audit_logs'
        AND indexname = 'audit_logs_created_at_idx'
      );
    `);
    const indexExistsBefore = indexRes.rows[0].exists;
    console.log(`[Status] audit_logs_created_at_idx already existed: ${indexExistsBefore}`);

    // 4. Apply the index
    console.log(`[Action] Applying CREATE INDEX...`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
      ON "audit_logs" USING btree ("created_at");
    `);

    // 5. Verify index exists afterward
    const indexResAfter = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'audit_logs'
        AND indexname = 'audit_logs_created_at_idx'
      );
    `);
    const indexExistsAfter = indexResAfter.rows[0].exists;
    console.log(`[Status] audit_logs_created_at_idx created successfully: ${indexExistsAfter}`);

  } catch (error) {
    console.error('[Error] Failed to apply index:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyIndex();
