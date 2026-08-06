import { analyticsService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ClientAnalytics = () => {
  const { data: stats, loading } = useFetch(analyticsService.getClientStats);

  if (loading) return <Loader className="py-24" size="lg" />;

  const bookingData = [
    { name: "Active", value: stats?.activeBookings || 0, color: "#3b82f6" },
    { name: "Completed", value: stats?.completedBookings || 0, color: "#22c55e" },
    { name: "Others", value: Math.max(0, (stats?.totalBookings || 0) - (stats?.activeBookings || 0) - (stats?.completedBookings || 0)), color: "#e5e7eb" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Bookings" value={stats?.totalBookings || 0} icon="📋" color="brand" />
        <StatsCard title="Active" value={stats?.activeBookings || 0} icon="🟢" color="blue" />
        <StatsCard title="Completed" value={stats?.completedBookings || 0} icon="✅" color="green" />
        <StatsCard title="Total Spend" value={formatCurrency(stats?.totalSpend || 0)} icon="💰" color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Booking Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {bookingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bookingData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {bookingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">Data nahi hai abhi</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Campaign Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { label: "Total Campaigns", value: stats?.totalBookings || 0, icon: "📢" },
              { label: "Active Campaigns", value: stats?.activeBookings || 0, icon: "🟢" },
              { label: "Completed Campaigns", value: stats?.completedBookings || 0, icon: "✅" },
              { label: "Total Investment", value: formatCurrency(stats?.totalSpend || 0), icon: "💰" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-gray-600 flex items-center gap-2">{icon} {label}</span>
                <span className="font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ClientAnalytics;
