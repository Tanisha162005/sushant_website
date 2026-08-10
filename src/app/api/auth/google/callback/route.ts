import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { UserRepository } from '@/repositories/user.repository';

const userRepo = new UserRepository();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Validate CSRF state parameter against HTTP-only cookie
  const storedState = req.cookies.get('g_oauth_state')?.value;

  // Build base response helper that clears state cookie immediately (replay protection)
  const createCleanResponse = (redirectUrl: string) => {
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete('g_oauth_state');
    return res;
  };

  if (!state || !storedState || state !== storedState) {
    console.error('CSRF State validation failed. Possible replay attack or expired state.');
    return createCleanResponse(`${baseUrl}/login?error=invalid_state`);
  }

  if (error || !code) {
    console.error('Google OAuth error:', error);
    return createCleanResponse(`${baseUrl}/login?error=google_access_denied`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not set.');
      return createCleanResponse(`${baseUrl}/login?error=missing_credentials`);
    }

    // 2. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to exchange code for tokens:', tokenData);
      return createCleanResponse(`${baseUrl}/login?error=token_exchange_failed`);
    }

    // 3. Fetch user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!googleUser || !googleUser.email) {
      return createCleanResponse(`${baseUrl}/login?error=profile_fetch_failed`);
    }

    let user = await userRepo.findByGoogleId(googleUser.id);

    if (!user) {
      user = await userRepo.findByEmail(googleUser.email);
      if (user) {
        // Link Google account
      } else {
        user = await userRepo.create({
          name: googleUser.name || googleUser.email.split('@')[0],
          email: googleUser.email,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
        });
      }
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const response = createCleanResponse(`${baseUrl}/`);
    response.cookies.set({
      name: 'user_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Google Callback Error:', err);
    return createCleanResponse(`${baseUrl}/login?error=server_error`);
  }
}
