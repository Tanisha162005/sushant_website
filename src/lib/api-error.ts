import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  logger.error('API Error:', error);
  
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: 'Validation Error', errors: error.issues },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    const isProd = process.env.NODE_ENV === 'production';
    const msgLower = error.message.toLowerCase();
    const containsSensitiveInfo = msgLower.includes('sql') || msgLower.includes('database') || msgLower.includes('secret') || msgLower.includes('password') || msgLower.includes('token') || msgLower.includes('connect');
    
    const message = isProd && containsSensitiveInfo
      ? 'An internal processing error occurred. Please try again later.'
      : error.message;

    return NextResponse.json({ success: false, message }, { status: 400 });
  }
  
  return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
}
