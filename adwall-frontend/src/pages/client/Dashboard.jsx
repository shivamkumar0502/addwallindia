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
import { Search, Megaphone, TrendingUp } from "lucide-react";

const ClientDashboard = () => {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useFetch(analyticsService.getClientStats);
  const { data: bookingsData, loading: bookingsLoading } = useFetch(() => bookingService.getMyBookings({ limit: 5 }));

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Namaste, {user?.name?.split(" ")[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Aaj kaunsa campaign plan kar rahe ho?</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild><Link to="/search"><Search size={16} className="mr-2" />Search Hoardings</Link></Button>
          <Button asChild><Link to="/client/campaigns"><Megaphone size={16} className="mr-2" />Broadcast Campaign</Link></Button>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? <Loader /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Bookings" value={stats?.totalBookings || 0} icon="📋" color="brand" />
          <StatsCard title="Active Campaigns" value={stats?.activeBookings || 0} icon="📢" color="blue" />
          <StatsCard title="Completed" value={stats?.completedBookings || 0} icon="✅" color="green" />
          <StatsCard title="Total Spend" value={formatCurrency(stats?.totalSpend || 0)} icon="💰" color="purple" />
        </div>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <Link to="/client/bookings" className="text-sm text-brand-500 hover:underline">Sabhi dekho →</Link>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? <Loader /> : !bookingsData?.bookings?.length ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">Abhi koi booking nahi hai</p>
              <Button size="sm" className="mt-4" asChild><Link to="/search">Pehli Booking Karo</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingsData.bookings.map(b => (
                <Link key={b._id} to={`/client/bookings/${b._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden">
                      {b.hoarding?.images?.[0] ? <img src={b.hoarding.images[0]} className="w-full h-full object-cover" /> : <span className="flex h-full items-center justify-center text-lg">🪧</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.hoarding?.title}</p>
                      <p className="text-xs text-gray-500">{b.hoarding?.location?.city} • {formatDate(b.startDate)}</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: "/client/campaigns", icon: "📢", title: "Broadcast Campaign", desc: "Multiple owners ko ek saath broadcast karo", color: "brand" },
          { to: "/ai/media-planner", icon: "🤖", title: "AI Media Planner", desc: "Budget aur city batao, AI plan banayega", color: "blue" },
          { to: "/client/wallet", icon: "💰", title: "Wallet", desc: "Transaction history aur balance dekho", color: "green" },
        ].map(({ to, icon, title, desc, color }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`text-2xl h-12 w-12 rounded-xl flex items-center justify-center ${color === "brand" ? "bg-orange-50" : color === "blue" ? "bg-blue-50" : "bg-green-50"}`}>{icon}</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default ClientDashboard;
