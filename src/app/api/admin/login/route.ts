import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    let adminUser: { id: string; email: string; role: string } | null = null;

    // 1. Check database for valid admin account with matching bcrypt password
    try {
      const dbUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (dbUsers.length > 0) {
        const user = dbUsers[0];
        if (user.password && user.role && user.email) {
          const adminRoles = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
          if (adminRoles.includes(user.role)) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
              adminUser = { id: user.id, email: user.email, role: user.role };
            }
          }
        }
      }
    } catch {
      // Fall through to environment verification if database query fails
    }

    // 2. Check explicitly configured environment variable credentials
    if (!adminUser && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        adminUser = {
          id: '00000000-0000-0000-0000-000000000000',
          email: process.env.ADMIN_EMAIL,
          role: 'super_admin',
        };
      }
    }

    // 3. Dev-only fallback for demo purposes when not in production
    if (!adminUser && process.env.NODE_ENV === 'development') {
      if (email === 'admin@example.com' && password === 'admin') {
        adminUser = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'admin@example.com',
          role: 'super_admin',
        };
      }
    }

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({ 
        email: adminUser.email, 
        role: adminUser.role,
        userId: adminUser.id
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('admin_token');
  return response;
}
