import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/services/admin.service';
import { handleApiError } from '@/lib/api-error';

const adminService = new AdminService();

export class AdminController {
  static async getDashboard(req: NextRequest) {
    try {
      const data = await adminService.getDashboardKPIs();
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
      return handleApiError(error);
    }
  }
}
