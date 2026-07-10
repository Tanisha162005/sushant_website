import { NextRequest } from 'next/server';
import { AdminController } from '@/controllers/admin.controller';

export async function GET(req: NextRequest) {
  return AdminController.getDashboard(req);
}
