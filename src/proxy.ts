import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { shouldShowWebsite } from '@/lib/site-mode';

// Edge-compatible multi-instance rate limit tracker
const edgeRateLimit = new Map<string, { count: number; expiresAt: number }>();

async function checkRateLimit(ip: string, category: string, limit: number, windowSecs: number): Promise<boolean> {
  const now = Date.now();
  const key = `ratelimit:${category}:${ip}`;

  // Attempt distributed rate limiting across server instances via Upstash/Redis REST API
  const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (restUrl && restToken) {
    try {
      const incrRes = await fetch(`${restUrl}/incr/${key}`, {
        headers: { Authorization: `Bearer ${restToken}` },
        cache: 'no-store',
      });
      const data = await incrRes.json();
      const current = Number(data.result || 1);
      if (current === 1) {
        await fetch(`${restUrl}/expire/${key}/${windowSecs}`, {
          headers: { Authorization: `Bearer ${restToken}` },
          cache: 'no-store',
        });
      }
      return current <= limit;
    } catch {
      // Gracefully fallback to in-memory store on transient network glitches
    }
  }

  // In-memory sliding window fallback for single-instance or when Redis REST is offline
  const record = edgeRateLimit.get(key);
  if (!record || now > record.expiresAt) {
    edgeRateLimit.set(key, { count: 1, expiresAt: now + windowSecs * 1000 });
    if (edgeRateLimit.size > 5000) {
      for (const [k, v] of edgeRateLimit) {
        if (now > v.expiresAt) edgeRateLimit.delete(k);
      }
    }
    return true;
  }
  record.count += 1;
  return record.count <= limit;
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const isLive = shouldShowWebsite(hostname);
  const pathname = request.nextUrl.pathname;

  // Coming Soon Mode: Block everything except essential routes
  if (!isLive) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/dashboard') ||
      pathname === '/favicon.ico' ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname === '/robots.txt' ||
      pathname.startsWith('/sitemap') ||
      pathname.endsWith('.xml') ||
      pathname.endsWith('.webmanifest') ||
      pathname === '/'
    ) {
      return NextResponse.next();
    }
    
    // Redirect all other requests to root (Coming Soon page)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rate Limiting layer for public and sensitive API endpoints
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    let limit = 600; // General API limit per minute
    let category = 'general_api';

    if (pathname.startsWith('/api/auth')) {
      limit = 100; // Auth endpoints (login, register, Google callback)
      category = 'auth_api';
    } else if (pathname.startsWith('/api/payments')) {
      limit = 100; // Payment order creation & verification
      category = 'payment_api';
    } else if (pathname === '/api/subscribe') {
      limit = 30; // Newsletter & contact spam protection
      category = 'subscribe_api';
    } else if (pathname.includes('/download')) {
      limit = 100; // Secure download abuse protection
      category = 'download_api';
    } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/upload') || pathname.startsWith('/api/r2')) {
      limit = 300;
      category = 'admin_api';
    }

    if (!(await checkRateLimit(ip, category, limit, 60))) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } }
      );
    }
  }

  // Protect Admin APIs and File Upload Endpoints at the Edge
  if (
    (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login') && !pathname.startsWith('/api/admin/forgot-password') && !pathname.startsWith('/api/admin/reset-password')) ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/r2')
  ) {
    const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Missing admin token' }, { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;
      const adminRoles = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
      if (!adminRoles.includes(role)) {
        return NextResponse.json({ success: false, message: 'Forbidden: Insufficient admin privileges' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, message: 'Unauthorized: Invalid admin token' }, { status: 401 });
    }
  }

  // Live Mode: Normal Admin authentication logic
  // Check if the path is under /admin (but not /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/forgot-password') && !pathname.startsWith('/admin/reset-password')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;
      const adminRoles = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
      
      if (!adminRoles.includes(role)) {
         return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url));
    }
  }

  // User Authentication Protection for Dashboard
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg)|robots.txt|sitemap.*\\.xml|.*\\.webmanifest).*)',
  ],
};
