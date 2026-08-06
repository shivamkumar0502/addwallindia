import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { hoardingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { MapPin, Eye, Plus, Ruler, Star } from "lucide-react";

const MyHoardings = () => {
  const navigate = useNavigate();
  const { data: hoardings, loading } = useFetch(hoardingService.getMyHoardings);

  const statusBadge = (status) => {
    const map = { verified: "✅ Verified", pending: "⏳ Pending", rejected: "❌ Rejected" };
    return map[status] || status;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Hoardings</h1>
          <p className="text-gray-500 text-sm mt-1">{hoardings?.length || 0} listings</p>
        </div>
        <Button onClick={() => navigate("/owner/add-hoarding")}>
          <Plus size={16} className="mr-2" />Add Hoarding
        </Button>
      </div>

      {loading ? <Loader className="py-24" size="lg" /> : !hoardings?.length ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🪧</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Koi hoarding nahi hai abhi</h3>
          <p className="text-gray-500 text-sm mb-6">Pehli hoarding add karo aur advertisers tak pahuncho</p>
          <Button onClick={() => navigate("/owner/add-hoarding")}>Add First Hoarding</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hoardings.map(h => (
            <Card key={h._id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {h.images?.[0]
                  ? <img src={h.images[0]} className="w-full h-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-4xl">🪧</div>}
                <div className="absolute top-2 left-2">
                  <Badge className={`text-xs ${getStatusColor(h.verificationStatus)}`}>
                    {statusBadge(h.verificationStatus)}
                  </Badge>
                </div>
                {!h.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Inactive</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{h.title}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin size={11} />{h.location?.area}, {h.location?.city}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Ruler size={11} />{h.dimensions?.width}×{h.dimensions?.height} ft</span>
                  <span className="flex items-center gap-1"><Eye size={11} />{h.views || 0} views</span>
                  {h.rating > 0 && <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400" />{h.rating}</span>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-brand-600">{formatCurrency(h.pricing?.perMonth)}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/hoarding/${h._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
                {h.verificationStatus === "rejected" && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
                    ❌ Rejected — Update karo aur resubmit karo
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyHoardings;
