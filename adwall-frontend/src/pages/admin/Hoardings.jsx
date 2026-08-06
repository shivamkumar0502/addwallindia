import { useState } from "react";
import { hoardingService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/common/Loader";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, MapPin, Ruler, Eye } from "lucide-react";
import useToast from "@/hooks/useToast";
import { Toast } from "@/components/ui/toast";

const AdminHoardings = () => {
  const { data: hoardings, loading, execute } = useFetch(hoardingService.getPending);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState("");
  const { toast, showToast } = useToast();

  const handleVerify = async (id, decision, rejectionReason = "") => {
    setProcessing(id);
    try {
      await hoardingService.verify(id, { decision, rejectionReason });
      showToast(`Hoarding ${decision}!`, "success");
      execute();
    } catch (err) {
      showToast("Action failed", "error");
    } finally { setProcessing(""); setRejecting(null); setReason(""); }
  };

  if (loading) return <div className="p-6"><Loader className="py-24" size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast {...toast} onClose={() => {}} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hoarding Verification</h1>
        <p className="text-gray-500 text-sm mt-1">{hoardings?.length || 0} pending hoardings</p>
      </div>

      {!hoardings?.length ? (
        <div className="text-center py-24">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900">Sabhi hoardings reviewed!</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {hoardings.map(h => (
            <Card key={h._id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="h-36 w-48 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {h.images?.[0] ? <img src={h.images[0]} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">🪧</div>}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{h.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">by {h.owner?.name} • {formatDate(h.createdAt)}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Pending</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={11} />{h.location?.area}, {h.location?.city}</span>
                      <span className="flex items-center gap-1"><Ruler size={11} />{h.dimensions?.width}×{h.dimensions?.height} ft</span>
                      <span className="flex items-center gap-1"><Eye size={11} />{h.dailyTraffic?.replace("_", " ")} traffic</span>
                    </div>
                    <div className="text-sm font-semibold text-brand-600">{formatCurrency(h.pricing?.perMonth)}/month</div>
                    {h.description && <p className="text-xs text-gray-500 line-clamp-2">{h.description}</p>}
                    {h.images?.length > 1 && (
                      <div className="flex gap-2 mt-2">
                        {h.images.slice(1, 4).map((img, i) => <img key={i} src={img} className="h-12 w-16 rounded object-cover" />)}
                        {h.images.length > 4 && <div className="h-12 w-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">+{h.images.length - 4}</div>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 justify-center flex-shrink-0">
                    <Button className="bg-green-600 hover:bg-green-700 w-28" size="sm" disabled={processing === h._id}
                      onClick={() => handleVerify(h._id, "verified")}>
                      <CheckCircle size={14} className="mr-1" />Approve
                    </Button>
                    <Button variant="destructive" size="sm" className="w-28" onClick={() => setRejecting(h._id)}>
                      <XCircle size={14} className="mr-1" />Reject
                    </Button>
                  </div>
                </div>

                {rejecting === h._id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea placeholder="Rejection reason batao..." value={reason} onChange={e => setReason(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" disabled={!reason || processing === h._id} onClick={() => handleVerify(h._id, "rejected", reason)}>Confirm Reject</Button>
                      <Button variant="outline" size="sm" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
                    </div>
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
export default AdminHoardings;
