import { useState } from "react";
import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import { formatCurrency } from "@/lib/utils";
import { Download, BarChart3, Users, CreditCard, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const AdminReports = () => {
  const [filters, setFilters] = useState({ from: "", to: "", status: "" });
  const [downloading, setDownloading] = useState(null);
  const { data: summary, loading } = useFetch(
    () => api.get("/reports/summary").then(r => r.data.data)
  );

  const downloadCSV = async (type) => {
    setDownloading(type);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.status) params.append("status", filters.status);

      const response = await api.get(`/reports/${type}?${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `adwall_${type}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally { setDownloading(null); }
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const chartData = summary?.monthlyData?.map(m => ({
    month: monthNames[m._id.month - 1],
    Revenue: m.totalRevenue,
    Commission: m.totalCommission,
    Bookings: m.count,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Data export aur business insights</p>
      </div>

      {/* Summary Stats */}
      {loading ? <Loader /> : summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: summary.totals.totalUsers, icon: <Users size={20} />, color: "bg-purple-50 text-purple-600" },
            { label: "Total Owners", value: summary.totals.totalOwners, icon: <MapPin size={20} />, color: "bg-teal-50 text-teal-600" },
            { label: "Active Hoardings", value: summary.totals.totalHoardings, icon: <BarChart3 size={20} />, color: "bg-orange-50 text-orange-600" },
            { label: "Completed Bookings", value: summary.totals.totalBookings, icon: <CreditCard size={20} />, color: "bg-green-50 text-green-600" },
          ].map(({ label, value, icon, color }) => (
            <Card key={label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Revenue {summary?.year}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => name === "Bookings" ? val : formatCurrency(val)} />
                <Bar dataKey="Revenue" fill="#f97316" radius={[4,4,0,0]} />
                <Bar dataKey="Commission" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader><CardTitle className="text-base">CSV Export</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
              <Input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
              <Input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status Filter</label>
              <Input placeholder="e.g. completed" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: "bookings", label: "Bookings", icon: "📋" },
              { type: "payments", label: "Payments", icon: "💳" },
              { type: "users", label: "Users", icon: "👥" },
              { type: "hoardings", label: "Hoardings", icon: "🪧" },
            ].map(({ type, label, icon }) => (
              <Button
                key={type}
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => downloadCSV(type)}
                disabled={downloading === type}
              >
                <span>{icon}</span>
                <Download size={14} />
                {downloading === type ? "Downloading..." : `${label} CSV`}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-400">CSV file automatically download hogi. Excel mein open kar sakte ho.</p>
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminReports;
