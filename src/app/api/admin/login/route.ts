import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // For development prototyping: allow any email with password 'admin'
    // In production, this would query the users table for role='super_admin' and verify a hashed password.
    if (password !== 'admin' && process.env.NODE_ENV !== 'development') {
        // If not in development, you MUST verify against the database. 
        // We will simulate a failure if it's not the dev password for safety.
        if(password !== process.env.ADMIN_PASSWORD) {
           return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }
    } else if (password !== 'admin' && password !== process.env.ADMIN_PASSWORD) {
       return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({ 
        email, 
        role: 'super_admin',
        userId: 'admin-id-mock' // In real app, this is user.id
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
