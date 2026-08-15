import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { UserRepository } from '@/repositories/user.repository';

const userRepo = new UserRepository();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await userRepo.findByEmail(cleanEmail);
    if (existingUser) {
      const isGoogleAccount = !existingUser.password && existingUser.googleId;
      const errorMsg = isGoogleAccount
        ? 'An account with this email ID is already registered using Google Sign-In. Please sign in with Google instead.'
        : 'An account with this email ID is already registered. Please login instead.';
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userRepo.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'user_token',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
