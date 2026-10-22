import { Client } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    const client = new Client({
        host: 'ep-fancy-mode-azopz0d1.c-3.ap-southeast-1.aws.neon.tech',
        database: 'neondb',
        user: 'neondb_owner',
        password: 'npg_pQuHWg5jRzC4',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const res = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public';
    `);
    console.log("Tables in DB:");
    console.table(res.rows);
    
    await client.end();
}
main().catch(console.error);
