import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/services/admin.service';
import { handleApiError } from '@/lib/api-error';
import { jwtVerify } from 'jose';

const adminService = new AdminService();

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (!['super_admin', 'admin', 'content_manager', 'support', 'finance_manager'].includes(role)) {
      throw new Error('Forbidden');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') throw err;
    throw new Error('Unauthorized');
  }
}

export class AdminController {
  static async getDashboard(req: NextRequest) {
    try {
      await verifyAdminAuth(req);
      const data = await adminService.getDashboardKPIs();
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
        return NextResponse.json({ success: false, message: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
      }
      return handleApiError(error);
    }
  }
}
