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
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
}
