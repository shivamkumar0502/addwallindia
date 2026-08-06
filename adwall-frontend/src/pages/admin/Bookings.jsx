import { useState } from "react";
import { bookingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { MapPin, Calendar } from "lucide-react";

const AdminBookings = () => {
  const [status, setStatus] = useState("");
  const { data, loading, execute } = useFetch(() => bookingService.adminGetAll({ status, limit: 30 }), [status]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total</p>
        </div>
        <Select value={status} onChange={e => { setStatus(e.target.value); execute(); }} className="w-52">
          <option value="">All Status</option>
          <option value="quote_requested">Quote Requested</option>
          <option value="confirmed">Confirmed</option>
          <option value="payment_done">Payment Done</option>
          <option value="proof_submitted">Proof Submitted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
        </Select>
      </div>

      {loading ? <Loader className="py-20" size="lg" /> : !data?.bookings?.length ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>Koi booking nahi mili</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bookings.map(b => (
            <Card key={b._id} className={b.status === "disputed" ? "border-red-300 bg-red-50" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 grid md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Client</p>
                      <p className="font-medium text-gray-900">{b.client?.name}</p>
                      <p className="text-xs text-gray-400">{b.client?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Owner</p>
                      <p className="font-medium text-gray-900">{b.owner?.name}</p>
                      <p className="text-xs text-gray-400">{b.owner?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Hoarding</p>
                      <p className="font-medium text-gray-900 truncate">{b.hoarding?.title}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{b.hoarding?.location?.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Dates & Amount</p>
                      <p className="text-xs flex items-center gap-1"><Calendar size={10} />{formatDate(b.startDate)} → {formatDate(b.endDate)}</p>
                      <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(b.pricing?.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge className={`${getStatusColor(b.status)} text-xs`}>{b.status.replace(/_/g, " ")}</Badge>
                    {b.status === "disputed" && <p className="text-xs text-red-500 mt-1">⚠️ Needs attention</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminBookings;
