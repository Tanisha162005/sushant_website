import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

config({ path: '.env.local' });
const { Client } = pkg;

async function seedAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const adminEmail = 'admin@sushant.com'; // you can change this
  
  try {
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Check if user exists
    const res = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (res.rows.length === 0) {
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO users (id, name, email, phone, role, password) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, 'Super Admin', adminEmail, '0000000000', 'super_admin', hashedPassword]);
      console.log('✅ Admin user created successfully: ' + adminEmail);
      console.log('Password is set to "admin".');
    } else {
      console.log('⚠️ Admin user already exists: ' + adminEmail);
      // update role to super_admin just in case and set password
      await client.query(`UPDATE users SET role = 'super_admin', password = $2 WHERE email = $1`, [adminEmail, hashedPassword]);
      console.log('✅ Updated existing user to super_admin and reset password to "admin".');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await client.end();
  }
}

seedAdmin();
