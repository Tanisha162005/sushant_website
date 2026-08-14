import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (isDev ? 'http://localhost:3000' : 'https://sushantghadge.com');
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Google OAuth is not configured. Missing GOOGLE_CLIENT_ID.',
      },
      { status: 500 }
    );
  }

  // Generate cryptographically random state parameter for CSRF & Replay Protection
  const state = crypto.randomBytes(32).toString('hex');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Store state in a 10-minute HTTP-only cookie for verification on callback
  response.cookies.set({
    name: 'g_oauth_state',
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
