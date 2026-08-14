import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRepository } from '@/repositories/user.repository';

export const dynamic = 'force-dynamic';

const userRepo = new UserRepository();

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, user: null },
      { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        }
      }
    );
  }
}
