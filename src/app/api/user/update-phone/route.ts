import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRepository } from '@/repositories/user.repository';

const userRepo = new UserRepository();

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
      if (!userId) throw new Error('Invalid token');
    } catch {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    const { phone } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const updatedUser = await userRepo.updatePhone(userId, phone);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Update phone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
