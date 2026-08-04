'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, BookOpen, DollarSign, ShoppingCart, Video, MessageSquare, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid rgba(168,85,247,0.1)',
          borderTopColor: '#A855F7',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  const kpis = [
    { title: 'Total Revenue', value: `₹${(data?.kpis?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #059669)', change: '+12.5%' },
    { title: 'Total Sales', value: data?.kpis?.salesCount || 0, icon: ShoppingCart, gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)', change: '+8.2%' },
    { title: 'Users', value: data?.kpis?.totalUsers || 0, icon: Users, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', change: '+24.1%' },
    { title: 'Courses', value: data?.kpis?.totalCourses || 0, icon: BookOpen, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', change: '+3' },
    { title: 'Page Views', value: data?.kpis?.pageViews || 12450, icon: TrendingUp, gradient: 'linear-gradient(135deg, #ec4899, #db2777)', change: '+14.2%' },
    { title: 'Open Tickets', value: data?.kpis?.openTickets || 0, icon: MessageSquare, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', change: '-5' },
  ];

  const salesData = (data?.revenueChart && data.revenueChart.length > 0) ? data.revenueChart : [
    { name: 'Jan', revenue: 4000, users: 24 },
    { name: 'Feb', revenue: 3000, users: 18 },
    { name: 'Mar', revenue: 5000, users: 32 },
    { name: 'Apr', revenue: 4500, users: 28 },
    { name: 'May', revenue: 6000, users: 41 },
    { name: 'Jun', revenue: 7000, users: 52 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(18,10,36,0.95)', border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: '12px', padding: '0.75rem 1rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D8B4FE', margin: '0 0 4px' }}>{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ fontSize: '0.75rem', color: entry.color, margin: '2px 0' }}>
              {entry.name}: {entry.name === 'revenue' ? `₹${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '1.25rem',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: kpi.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                <kpi.icon style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, color: '#4ade80',
                display: 'flex', alignItems: 'center', gap: '2px',
                background: 'rgba(74,222,128,0.08)', padding: '3px 8px', borderRadius: '20px',
              }}>
                <ArrowUpRight style={{ width: 12, height: 12 }} />
                {kpi.change}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b5e88', marginBottom: '0.25rem' }}>
              {kpi.title}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#eef0f6', letterSpacing: '-0.02em' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Revenue Chart */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp style={{ width: 18, height: 18, color: '#A855F7' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#eef0f6' }}>Revenue Analytics</h3>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueChart || salesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b5e88', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b5e88', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users Chart */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Users style={{ width: 18, height: 18, color: '#6366f1' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#eef0f6' }}>User Registrations</h3>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b5e88', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b5e88', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
