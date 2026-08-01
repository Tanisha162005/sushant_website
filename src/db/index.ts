import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | undefined;
let db: any;

if (process.env.WEBSITE_LIVE === 'true') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool, { schema });
} else {
  // Mock DB for coming soon mode to prevent connection errors
  db = {} as any;
}

export { db };
