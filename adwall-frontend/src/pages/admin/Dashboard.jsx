import { Link } from "react-router-dom";
import { analyticsService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const { data: stats, loading } = useFetch(analyticsService.getAdminStats);

  if (loading) return <div className="p-6"><Loader size="lg" className="py-24" /></div>;

  const { overview, topCities, monthlyBookings, topHoardings } = stats || {};

  const chartData = monthlyBookings?.map(m => ({
    name: `${m._id.month}/${m._id.year}`,
    bookings: m.count,
    revenue: m.revenue,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/admin/kyc">Pending KYC</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/admin/hoardings">Pending Hoardings</Link></Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={overview?.totalUsers || 0} icon="👥" color="brand" subtitle={`${overview?.totalClients} clients, ${overview?.totalOwners} owners`} />
        <StatsCard title="Total Hoardings" value={overview?.totalHoardings || 0} icon="🪧" color="blue" subtitle={`${overview?.pendingHoardings} pending verify`} />
        <StatsCard title="Total Bookings" value={overview?.totalBookings || 0} icon="📋" color="green" subtitle={`${overview?.activeBookings} active`} />
        <StatsCard title="Platform Revenue" value={formatCurrency(overview?.platformRevenue || 0)} icon="💰" color="purple" subtitle={`Total GMV: ${formatCurrency(overview?.totalRevenue || 0)}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Bookings (Last 6 months)</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Data abhi available nahi hai</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, name) => name === "revenue" ? formatCurrency(val) : val} />
                  <Bar dataKey="bookings" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Cities by Hoardings</CardTitle></CardHeader>
          <CardContent>
            {!topCities?.length ? (
              <div className="text-center py-8 text-gray-400 text-sm">Data nahi hai abhi</div>
            ) : (
              <div className="space-y-3">
                {topCities.map(({ _id, count }) => (
                  <div key={_id} className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900 w-28 truncate">{_id}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${(count / topCities[0].count) * 100}%` }} />
                    </div>
                    <div className="text-sm text-gray-500 w-8 text-right">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/admin/kyc", label: "KYC Review", count: overview?.pendingHoardings, icon: "🔍" },
          { to: "/admin/hoardings", label: "Verify Hoardings", count: overview?.pendingHoardings, icon: "✅" },
          { to: "/admin/bookings", label: "All Bookings", count: overview?.totalBookings, icon: "📋" },
          { to: "/admin/users", label: "Users", count: overview?.totalUsers, icon: "👥" },
        ].map(({ to, label, count, icon }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{label}</div>
                {count !== undefined && <div className="text-xs text-gray-500 mt-1">{count} total</div>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default AdminDashboard;
