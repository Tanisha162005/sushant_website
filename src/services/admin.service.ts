import { db } from '@/db';
import { users, courses, payments, webinars, supportTickets } from '@/db/schema';
import { sql } from 'drizzle-orm';

export class AdminService {
  async getDashboardKPIs() {
    // Note: Drizzle ORM queries using raw SQL for aggregations
    const [userStats] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users);
    const [courseStats] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(courses);
    const [paymentStats] = await db.select({
      totalRevenue: sql<number>`cast(sum(${payments.amount}) as integer)`,
      salesCount: sql<number>`cast(count(*) as integer)`
    }).from(payments).where(sql`${payments.status} = 'successful'`);
    const [ticketStats] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(supportTickets).where(sql`${supportTickets.status} = 'open'`);

    // Fetch actual monthly revenue data
    const monthlyStats = await db.execute(sql`
      SELECT 
        to_char(created_at, 'Mon') as name, 
        SUM(amount) as revenue,
        COUNT(DISTINCT user_id) as users
      FROM payments
      WHERE status = 'successful'
      GROUP BY to_char(created_at, 'Mon'), EXTRACT(month FROM created_at)
      ORDER BY EXTRACT(month FROM created_at)
    `);

    const revenueChart = monthlyStats.rows.map((row: Record<string, unknown>) => ({
      name: row.name,
      revenue: Number(row.revenue) / 100, // convert from paise
      users: Number(row.users)
    }));

    return {
      kpis: {
        totalUsers: userStats.count || 0,
        totalCourses: courseStats.count || 0,
        totalRevenue: (paymentStats.totalRevenue || 0) / 100, // convert from cents
        salesCount: paymentStats.salesCount || 0,
        pageViews: 0, // Requires an analytics integration to track
        openTickets: ticketStats.count || 0,
      },
      revenueChart,
    };
  }
}
