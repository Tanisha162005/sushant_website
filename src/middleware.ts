import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Check if the path is under /admin (but not /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    // Attempt to get the token from cookies
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify JWT using jose (since jsonwebtoken is not Edge compatible)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      
      const role = payload.role as string;
      const adminRoles = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
      
      if (!adminRoles.includes(role)) {
         return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url));
    }
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
};
