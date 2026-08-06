import { useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

const STATUSES = ["", "quote_requested", "quote_received", "confirmed", "payment_done", "proof_submitted", "completed", "cancelled"];

const MyBookings = () => {
  const [status, setStatus] = useState("");
  const { data, loading, execute } = useFetch(() => bookingService.getMyBookings({ status }));

  const handleFilter = (val) => { setStatus(val); execute(); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Select value={status} onChange={e => handleFilter(e.target.value)} className="w-48">
          <option value="">All Status</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </Select>
      </div>

      {loading ? <Loader className="py-24" size="lg" /> : !data?.bookings?.length ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Koi booking nahi mili</h3>
          <p className="text-gray-500 text-sm mb-6">Filter change karo ya nayi booking karo</p>
          <Button asChild><Link to="/search">Hoarding Search Karo</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.bookings.map(b => (
            <Card key={b._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Hoarding Image */}
                  <div className="h-20 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {b.hoarding?.images?.[0]
                      ? <img src={b.hoarding.images[0]} className="w-full h-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-2xl">🪧</div>}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{b.hoarding?.title || "Hoarding"}</h3>
                      <Badge className={`text-xs flex-shrink-0 ${getStatusColor(b.status)}`}>{b.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={11} />{b.hoarding?.location?.city}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(b.pricing?.totalAmount)}</div>
                      {b.status === "quote_received" && <span className="text-xs text-orange-600 font-medium animate-pulse">• Quote aaya hai! Review karo</span>}
                      {b.status === "proof_submitted" && <span className="text-xs text-blue-600 font-medium animate-pulse">• Proof verify karo</span>}
                    </div>
                  </div>

                  {/* Action */}
                  <Link to={`/client/bookings/${b._id}`} className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Details <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyBookings;
