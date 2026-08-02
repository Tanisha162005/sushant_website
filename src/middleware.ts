import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { shouldShowWebsite } from '@/lib/site-mode';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const isLive = shouldShowWebsite(hostname);
  const pathname = request.nextUrl.pathname;

  // Coming Soon Mode: Block everything except essential routes
  if (!isLive) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname === '/favicon.ico' ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname === '/robots.txt' ||
      pathname.startsWith('/sitemap') ||
      pathname.endsWith('.xml') ||
      pathname.endsWith('.webmanifest') ||
      pathname === '/api/subscribe' ||
      pathname === '/'
    ) {
      return NextResponse.next();
    }
    
    // Redirect all other requests to root (Coming Soon page)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Live Mode: Normal Admin authentication logic
  // Check if the path is under /admin (but not /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg)|robots.txt|sitemap.*\\.xml|.*\\.webmanifest).*)',
  ],
};
