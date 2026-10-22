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
        SELECT u.email, pr.* 
        FROM password_reset_tokens pr
        JOIN users u ON pr.user_id = u.id
        WHERE u.email = 'tanishabadgujar1604@gmail.com'
        ORDER BY pr.created_at DESC
        LIMIT 5;
    `);
    console.log("Recent Password Reset Tokens:");
    console.table(res.rows);
    
    await client.end();
}
main().catch(console.error);
