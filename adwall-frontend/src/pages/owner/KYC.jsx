import { useState } from "react";
import { kycService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, Upload, FileText } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import Loader from "@/components/common/Loader";

const OwnerKyc = () => {
  const { user, updateUser } = useAuth();
  const [files, setFiles] = useState({ aadhaar: null, pan: null, selfie: null });
  const [form, setForm] = useState({ gstNumber: "", companyName: "", agencyName: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // API se actual KYC data fetch karo
  const { data: kycData, loading: kycLoading } = useFetch(kycService.getStatus);

  const handleFile = (key, file) => setFiles(f => ({ ...f, [key]: file }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.aadhaar || !files.pan || !files.selfie) {
      setError("Aadhaar, PAN aur Selfie teeno required hain"); return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("aadhaar", files.aadhaar);
      fd.append("pan", files.pan);
      fd.append("selfie", files.selfie);
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      await kycService.submit(fd);
      updateUser({ kycStatus: "pending" });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
    } finally { setLoading(false); }
  };

  if (kycLoading) return <Loader className="py-24" size="lg" />;

  // ✅ KEY FIX: Documents actually submit hue hain ya nahi — ye check karo
  // kycStatus "pending" sirf tab meaningful hai jab aadhaarUrl exist kare
  const docsSubmitted = !!kycData?.kycDocuments?.aadhaarUrl;
  const kycStatus = kycData?.kycStatus || "pending";

  // Success state (just submitted)
  if (success) {
    return (
      <div className="p-6 max-w-lg">
        <Card>
          <CardContent className="p-10 text-center">
            <Clock size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
            <p className="text-gray-500 text-sm">Admin 24-48 hours me review karega. Status update hone pe notification milega.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verified state
  if (kycStatus === "verified") {
    return (
      <div className="p-6 max-w-lg">
        <Card>
          <CardContent className="p-10 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">KYC Verified! ✅</h2>
            <p className="text-gray-500 text-sm">Badhai ho! Ab aap hoardings add kar sakte ho.</p>
            {kycData?.kycDocuments && (
              <div className="mt-6 text-left space-y-2 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Submitted Documents:</p>
                {[["Aadhaar", kycData.kycDocuments.aadhaarUrl], ["PAN", kycData.kycDocuments.panUrl], ["Selfie", kycData.kycDocuments.selfieUrl]].map(([label, url]) =>
                  url ? <a key={label} href={url} target="_blank" className="flex items-center gap-2 text-xs text-blue-600 hover:underline"><FileText size={12} />{label} — View</a> : null
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending state — ONLY if docs already submitted
  if (docsSubmitted && kycStatus === "pending") {
    return (
      <div className="p-6 max-w-lg">
        <Card>
          <CardContent className="p-10 text-center">
            <Clock size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review Pending</h2>
            <p className="text-gray-500 text-sm">Aapke documents admin ke paas review ke liye hain. 24-48 hours me update aayega.</p>
            <div className="mt-6 text-left space-y-2 bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Submitted Documents:</p>
              {[["Aadhaar", kycData.kycDocuments.aadhaarUrl], ["PAN", kycData.kycDocuments.panUrl], ["Selfie", kycData.kycDocuments.selfieUrl]].map(([label, url]) =>
                url ? <a key={label} href={url} target="_blank" className="flex items-center gap-2 text-xs text-yellow-700 hover:underline"><FileText size={12} />{label} — View</a> : null
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected state — show form again to resubmit
  // OR fresh user (docsSubmitted = false) — show form

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Hoarding list karne ke liye identity verify karna zaroori hai</p>
      </div>

      {kycStatus === "rejected" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-sm">KYC Rejected — Dobara Submit Karo</p>
            <p className="text-red-600 text-xs mt-1">Sahi aur clear documents upload karo.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

        {/* Document Upload */}
        <Card>
          <CardHeader><CardTitle className="text-base">Identity Documents</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "aadhaar", label: "Aadhaar Card *", hint: "Front side ka photo ya PDF (max 5MB)" },
              { key: "pan", label: "PAN Card *", hint: "PAN card ka clear photo (max 5MB)" },
              { key: "selfie", label: "Selfie with Aadhaar *", hint: "Aadhaar haath me pakad ke selfie lo" },
            ].map(({ key, label, hint }) => (
              <div key={key} className="flex items-center gap-4 p-4 border rounded-xl hover:border-brand-300 transition-colors">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${files[key] ? "bg-green-100" : "bg-gray-100"}`}>
                  {files[key] ? <CheckCircle size={20} className="text-green-500" /> : <Upload size={20} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{files[key] ? `✓ ${files[key].name}` : hint}</p>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    id={`file-${key}`}
                    onChange={e => handleFile(key, e.target.files[0])}
                  />
                  <label htmlFor={`file-${key}`}>
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`file-${key}`).click()}>
                      {files[key] ? "Change" : "Upload"}
                    </Button>
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Business Details <span className="text-gray-400 font-normal text-xs">(Optional)</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                <Input placeholder="ABC Pvt Ltd" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Agency Name</label>
                <Input placeholder="XYZ Advertising" value={form.agencyName} onChange={e => setForm(f => ({ ...f, agencyName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
              <Input placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Business Address</label>
              <Input placeholder="Full business address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? "Submitting..." : "KYC Documents Submit Karo"}
        </Button>
      </form>
    </div>
  );
};
export default OwnerKyc;
