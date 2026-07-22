import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // HARDCODED BYPASS for projection/development
    if (email !== 'admin@example.com' || password !== 'admin') {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const adminUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'admin@example.com',
      role: 'super_admin'
    };

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
