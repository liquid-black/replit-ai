import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import { users } from './shared/schema.ts';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seedAdmin() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const hashedPassword = await bcrypt.hash('xtracxtADMIN1025', 10);

    await db.insert(users).values({
      username: 'xadmin',
      password: hashedPassword,
      email: 'xadmin@schultzfamily.ca',
    });

    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

seedAdmin();

