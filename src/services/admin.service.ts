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
    const [webinarStats] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(webinars);
    const [ticketStats] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(supportTickets).where(sql`${supportTickets.status} = 'open'`);

    // Monthly revenue chart data (mocked for simplicity, in a real app this would group by month)
    const revenueChart = [
      { name: 'Jan', revenue: 4000 },
      { name: 'Feb', revenue: 3000 },
      { name: 'Mar', revenue: 5000 },
      { name: 'Apr', revenue: 4500 },
      { name: 'May', revenue: 6000 },
      { name: 'Jun', revenue: 7000 },
    ];

    return {
      kpis: {
        totalUsers: userStats.count || 0,
        totalCourses: courseStats.count || 0,
        totalRevenue: (paymentStats.totalRevenue || 0) / 100, // convert from cents
        salesCount: paymentStats.salesCount || 0,
        totalWebinars: webinarStats.count || 0,
        openTickets: ticketStats.count || 0,
      },
      revenueChart,
    };
  }
}
