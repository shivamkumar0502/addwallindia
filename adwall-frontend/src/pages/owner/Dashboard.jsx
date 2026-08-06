import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { analyticsService, bookingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, AlertCircle } from "lucide-react";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useFetch(analyticsService.getOwnerStats);
  const { data: bookingsData, loading: bookingsLoading } = useFetch(() => bookingService.getOwnerBookings({ limit: 5 }));

  const kycPending = user?.kycStatus !== "verified";

  return (
    <div className="p-6 space-y-6">
      {/* KYC Warning */}
      {kycPending && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-800 text-sm">KYC Verification Pending</p>
            <p className="text-yellow-700 text-xs mt-1">Hoarding list karne ke liye pehle KYC complete karo.</p>
          </div>
          <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700" asChild>
            <Link to="/owner/kyc">KYC Karo</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Namaste, {user?.name?.split(" ")[0]}!</p>
        </div>
        <Button asChild disabled={kycPending}>
          <Link to="/owner/add-hoarding"><Plus size={16} className="mr-2" />Add Hoarding</Link>
        </Button>
      </div>

      {/* Stats */}
      {statsLoading ? <Loader /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Hoardings" value={stats?.overview?.totalHoardings || 0} icon="🪧" color="brand" />
          <StatsCard title="Active Listings" value={stats?.overview?.activeHoardings || 0} icon="✅" color="green" />
          <StatsCard title="Total Bookings" value={stats?.overview?.totalBookings || 0} icon="📋" color="blue" />
          <StatsCard title="Total Earnings" value={formatCurrency(stats?.overview?.totalEarnings || 0)} icon="💰" color="purple" subtitle="Completed payouts" />
        </div>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Booking Requests</CardTitle>
          <Link to="/owner/bookings" className="text-sm text-brand-500 hover:underline">Sabhi dekho →</Link>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? <Loader /> : !bookingsData?.bookings?.length ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">Abhi koi booking request nahi hai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingsData.bookings.map(b => (
                <Link key={b._id} to={`/owner/bookings/${b._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {b.client?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.client?.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(b.startDate)} → {formatDate(b.endDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs ${getStatusColor(b.status)}`}>{b.status.replace(/_/g, " ")}</Badge>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(b.pricing?.totalAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default OwnerDashboard;
