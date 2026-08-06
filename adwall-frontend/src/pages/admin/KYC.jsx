import { useState } from "react";
import { kycService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/common/Loader";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, FileText, User, Phone, Mail } from "lucide-react";
import useToast from "@/hooks/useToast";
import { Toast } from "@/components/ui/toast";

const AdminKYC = () => {
  const { data: owners, loading, execute } = useFetch(kycService.getPending);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState("");
  const { toast, showToast } = useToast();

  const handleReview = async (userId, decision, rejectionReason = "") => {
    setProcessing(userId);
    try {
      await kycService.review(userId, { decision, rejectionReason });
      showToast(`KYC ${decision} successfully!`, "success");
      execute();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally { setProcessing(""); setRejecting(null); setReason(""); }
  };

  if (loading) return <div className="p-6"><Loader className="py-24" size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast {...toast} onClose={() => {}} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-500 text-sm mt-1">{owners?.length || 0} pending requests</p>
        </div>
      </div>

      {!owners?.length ? (
        <div className="text-center py-24">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900">Sabhi KYC reviewed!</h3>
          <p className="text-gray-400 text-sm mt-1">Koi pending request nahi hai abhi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {owners.map(owner => (
            <Card key={owner._id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Owner Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-600">{owner.name?.[0]}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{owner.name}</h3>
                        <p className="text-xs text-gray-400">Submitted {formatDate(owner.createdAt)}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" />{owner.email}</div>
                      <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" />{owner.mobile}</div>
                      {owner.businessDetails?.agencyName && <div className="flex items-center gap-2"><User size={13} className="text-gray-400" />{owner.businessDetails.agencyName}</div>}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-3">Documents</p>
                    <div className="space-y-2">
                      {[
                        { label: "Aadhaar", url: owner.kycDocuments?.aadhaarUrl },
                        { label: "PAN", url: owner.kycDocuments?.panUrl },
                        { label: "Selfie", url: owner.kycDocuments?.selfieUrl },
                      ].map(({ label, url }) => (
                        <div key={label} className="flex items-center gap-3">
                          {url ? (
                            <a href={url} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                              <FileText size={14} />{label} - View
                            </a>
                          ) : (
                            <span className="flex items-center gap-2 text-sm text-gray-400"><FileText size={14} />{label} - Not uploaded</span>
                          )}
                        </div>
                      ))}
                      {owner.kycDocuments?.gstNumber && <p className="text-xs text-gray-500">GST: {owner.kycDocuments.gstNumber}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 justify-center">
                    <Button className="bg-green-600 hover:bg-green-700" size="sm" disabled={processing === owner._id}
                      onClick={() => handleReview(owner._id, "verified")}>
                      <CheckCircle size={14} className="mr-2" />Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setRejecting(owner._id)}>
                      <XCircle size={14} className="mr-2" />Reject
                    </Button>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                {rejecting === owner._id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea placeholder="Rejection reason batao (owner ko email jaayega)..." value={reason} onChange={e => setReason(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" disabled={!reason || processing === owner._id} onClick={() => handleReview(owner._id, "rejected", reason)}>
                        Confirm Reject
                      </Button>
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
export default AdminKYC;
