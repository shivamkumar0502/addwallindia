import { useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Calendar, ArrowRight, IndianRupee } from "lucide-react";
import VerifiedBadge from "@/components/common/VerifiedBadge";

const OwnerBookings = () => {
  const [status, setStatus] = useState("");
  const { data, loading, execute } = useFetch(() => bookingService.getOwnerBookings({ status }), [status]);

  const ACTION_HINT = {
    quote_requested: { text: "Quote bhejo!", color: "text-orange-600 animate-pulse" },
    quote_received: { text: "Client review kar raha hai", color: "text-yellow-600" },
    confirmed: { text: "Payment ka wait karo", color: "text-blue-600" },
    payment_done: { text: "Proof upload karo!", color: "text-purple-600 animate-pulse" },
    proof_submitted: { text: "Client approval ka wait", color: "text-green-600" },
    completed: { text: "Completed ✅", color: "text-green-700" },
    cancelled: { text: "Cancelled", color: "text-gray-400" },
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total bookings</p>
        </div>
        <Select value={status} onChange={e => { setStatus(e.target.value); execute(); }} className="w-52">
          <option value="">All Status</option>
          <option value="quote_requested">Quote Requested</option>
          <option value="quote_received">Quote Sent</option>
          <option value="confirmed">Confirmed</option>
          <option value="payment_done">Payment Done</option>
          <option value="proof_submitted">Proof Submitted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {loading ? <Loader className="py-24" size="lg" /> : !data?.bookings?.length ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Koi booking nahi mili</h3>
          <p className="text-gray-400 text-sm">Filter change karo ya naya hoarding add karo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bookings.map(b => {
            const hint = ACTION_HINT[b.status];
            return (
              <Card key={b._id} className={`hover:shadow-md transition-shadow ${b.status === "quote_requested" || b.status === "payment_done" ? "border-brand-200 bg-orange-50/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Client Avatar */}
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
                      {b.client?.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{b.client?.name}</p>
                            {/* Owner ko dikhe ki advertiser KYC verified hai ya nahi */}
                            <VerifiedBadge status={b.client?.kycStatus} size="xs" />
                          </div>
                          <p className="text-xs text-gray-500">{b.client?.email}</p>
                        </div>
                        <Badge className={`text-xs flex-shrink-0 ${getStatusColor(b.status)}`}>
                          {b.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700 truncate">{b.hoarding?.title}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-800"><IndianRupee size={11} />{b.pricing?.totalAmount?.toLocaleString("en-IN")}</span>
                      </div>
                      {hint && <p className={`text-xs mt-1.5 font-medium ${hint.color}`}>• {hint.text}</p>}
                    </div>

                    {/* Action */}
                    <Link to={`/owner/bookings/${b._id}`} className="flex-shrink-0">
                      <Button size="sm" className={b.status === "quote_requested" ? "" : "variant-outline"} variant={b.status === "quote_requested" ? "default" : "outline"}>
                        {b.status === "quote_requested" ? "Quote Bhejo" : b.status === "payment_done" ? "Proof Upload" : "Details"}
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default OwnerBookings;