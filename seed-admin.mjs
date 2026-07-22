import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import crypto from 'crypto';

config({ path: '.env.local' });
const { Client } = pkg;

async function seedAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const adminEmail = 'admin@sushant.com'; // you can change this
  
  try {
    // Check if user exists
    const res = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (res.rows.length === 0) {
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO users (id, name, email, phone, role) 
        VALUES ($1, $2, $3, $4, $5)
      `, [id, 'Super Admin', adminEmail, '0000000000', 'super_admin']);
      console.log('✅ Admin user created successfully: ' + adminEmail);
      console.log('Password is the ADMIN_PASSWORD environment variable or "admin" by default.');
    } else {
      console.log('⚠️ Admin user already exists: ' + adminEmail);
      // update role to super_admin just in case
      await client.query(`UPDATE users SET role = 'super_admin' WHERE email = $1`, [adminEmail]);
      console.log('✅ Updated existing user to super_admin.');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await client.end();
  }
}

seedAdmin();
