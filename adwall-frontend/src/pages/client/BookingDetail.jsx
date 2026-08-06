import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookingService, quoteService, agreementService } from "@/services/api";
import useRazorpay from "@/hooks/useRazorpay";
import useToast from "@/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  ArrowLeft, CreditCard, FileText, CheckCircle,
  Clock, MapPin, Calendar, Upload, Download,
  Star, Send, IndianRupee,
  MessageCircle
} from "lucide-react";

/* ── Timeline ── */
const TIMELINE = [
  { key: "quote_requested",  label: "Request" },
  { key: "quote_received",   label: "Quote Aaya" },
  { key: "confirmed",        label: "Confirmed" },
  { key: "payment_done",     label: "Payment" },
  { key: "proof_submitted",  label: "Proof" },
  { key: "completed",        label: "Completed" },
];
const stepIdx = (status) => TIMELINE.findIndex(s => s.key === status);

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();
  const { toast, showToast } = useToast();

  const isClient = user?.role === "client";
  const isOwner  = user?.role === "owner";

  /* ── State ── */
  const [booking, setBooking]     = useState(null);
  const [quotes,  setQuotes]      = useState([]);
  const [loading, setLoading]     = useState(true);

  // Owner: send quote form
  const [quoteForm, setQuoteForm] = useState({ amount: "", message: "", validDays: "3" });
  const [sendingQuote, setSendingQuote] = useState(false);

  // Client: payment
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Owner: proof upload
  const [proofFiles, setProofFiles]   = useState([]);
  const [proofLoading, setProofLoading] = useState(false);

  // Client: approve
  const [remarks, setRemarks]         = useState("");
  const [approveLoading, setApproveLoading] = useState(false);

  // Agreement
  const [agreementLoading, setAgreementLoading] = useState(false);

  // Review
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);

  /* ── Fetch booking + quotes together ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: bData } = await bookingService.getById(id);
      const b = bData.data;
      setBooking(b);

      // Quotes fetch karo — owner aur client dono ke liye
      try {
        const { data: qData } = await quoteService.getByBooking(id);
        setQuotes(qData.data || []);
      } catch { setQuotes([]); }
    } catch (err) {
      showToast("Booking load nahi hua", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  /* ── Owner: Send Quote ── */
  const handleSendQuote = async (e) => {
    e.preventDefault();
    if (!quoteForm.amount) { showToast("Amount required hai", "error"); return; }
    setSendingQuote(true);
    try {
      await quoteService.send({
        bookingId: id,
        amount: parseFloat(quoteForm.amount),
        message: quoteForm.message,
        validDays: parseInt(quoteForm.validDays),
      });
      showToast("Quote bhej diya! Client review karega.", "success");
      setQuoteForm({ amount: "", message: "", validDays: "3" });
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Quote send failed", "error");
    } finally { setSendingQuote(false); }
  };

  /* ── Client: Accept Quote ── */
  const handleAcceptQuote = async (quoteId) => {
    try {
      await quoteService.accept(quoteId);
      showToast("Quote accepted! Ab payment karo.", "success");
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Accept failed", "error");
    }
  };

  /* ── Client: Reject Quote ── */
  const handleRejectQuote = async (quoteId) => {
    try {
      await quoteService.reject(quoteId);
      showToast("Quote rejected.", "success");
      await fetchAll();
    } catch (err) {
      showToast("Reject failed", "error");
    }
  };

  /* ── Client: Razorpay Payment ── */
  const handlePayment = () => {
    setPaymentLoading(true);
    initiatePayment({
      bookingId: id,
      userName: user.name,
      userEmail: user.email,
      userMobile: user.mobile,
      onSuccess: async () => {
        showToast("Payment successful! Escrow me safe hai. 🎉", "success");
        await fetchAll();
        setPaymentLoading(false);
      },
      onError: (msg) => {
        showToast(msg || "Payment failed", "error");
        setPaymentLoading(false);
      },
    });
  };

  /* ── Owner: Submit Proof ── */
  const handleSubmitProof = async () => {
    if (!proofFiles.length) { showToast("Photo select karo", "error"); return; }
    setProofLoading(true);
    try {
      const fd = new FormData();
      proofFiles.forEach(f => fd.append("images", f));
      await bookingService.submitProof(id, fd);
      showToast("Proof submitted! Client review karega.", "success");
      setProofFiles([]);
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally { setProofLoading(false); }
  };

  /* ── Client: Approve Installation ── */
  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      await bookingService.approve(id, { remarks });
      showToast("Approved! Payment release ho gaya. 🎉", "success");
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed", "error");
    } finally { setApproveLoading(false); }
  };

  /* ── Generate Agreement ── */
  const handleAgreement = async () => {
    setAgreementLoading(true);
    try {
      const { data } = await agreementService.generate(id);
      showToast("Agreement ready!", "success");
      await fetchAll();
      if (data.data?.pdfUrl) window.open(data.data.pdfUrl, "_blank");
    } catch (err) {
      showToast(err.response?.data?.message || "Agreement failed", "error");
    } finally { setAgreementLoading(false); }
  };

  /* ── Cancel Booking ── */
  const handleCancel = async () => {
    const reason = window.prompt("Cancellation reason batao:");
    if (!reason) return;
    try {
      await bookingService.cancel(id, { reason });
      showToast("Booking cancelled.", "success");
      await fetchAll();
    } catch (err) {
      showToast("Cancel failed", "error");
    }
  };

  if (loading) return <Loader className="min-h-screen" size="lg" />;
  if (!booking) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Booking not found</p>
      <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const currentStep = stepIdx(booking.status);
  const isCancelled = ["cancelled","disputed"].includes(booking.status);

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-5">
      {toast && <Toast {...toast} onClose={() => {}} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-xs text-gray-400 truncate">#{booking._id}</p>
        </div>
        <Badge className={`${getStatusColor(booking.status)} text-xs px-3 py-1 flex-shrink-0`}>
          {booking.status.replace(/_/g, " ").toUpperCase()}
        </Badge>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start overflow-x-auto gap-0 pb-1">
              {TIMELINE.map((s, i) => {
                const done   = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={s.key} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                        ${done ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-gray-200 text-gray-300"}`}>
                        {i < currentStep ? <CheckCircle size={13} /> : i + 1}
                      </div>
                      <p className={`text-[10px] mt-1 text-center leading-tight
                        ${active ? "text-brand-600 font-bold" : done ? "text-gray-500" : "text-gray-300"}`}>
                        {s.label}
                      </p>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`h-0.5 w-6 mb-4 mx-0.5 flex-shrink-0 ${i < currentStep ? "bg-brand-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {/* ── Left Column ── */}
        <div className="md:col-span-2 space-y-4">

          {/* Hoarding Info */}
          <Card>
            <CardContent className="p-4 flex gap-4">
              <div className="h-20 w-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {booking.hoarding?.images?.[0]
                  ? <img src={booking.hoarding.images[0]} className="w-full h-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-3xl">🪧</div>}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{booking.hoarding?.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} />{booking.hoarding?.location?.area}, {booking.hoarding?.location?.city}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} />{formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                </p>
                {booking.requirements && (
                  <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded p-2 line-clamp-2">📋 {booking.requirements}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════
              OWNER ACTIONS
          ══════════════════════════════════════════ */}
          {isOwner && (
            <>
              {/* Owner: Quote bhejne ka form — status quote_requested pe */}
              {booking.status === "quote_requested" && (
                <Card className="border-brand-200 bg-orange-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send size={16} className="text-brand-500" />
                      Client ko Quote Bhejo
                    </CardTitle>
                    <p className="text-xs text-gray-500">Client ne quote request kiya hai — apna rate batao</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendQuote} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">
                            Amount (₹) *
                          </label>
                          <div className="relative">
                            <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                              type="number"
                              className="pl-8"
                              placeholder="e.g. 15000"
                              value={quoteForm.amount}
                              onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Valid For (Days)</label>
                          <Input
                            type="number"
                            placeholder="3"
                            value={quoteForm.validDays}
                            onChange={e => setQuoteForm(f => ({ ...f, validDays: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Message (Optional)</label>
                        <Textarea
                          placeholder="Client ke liye koi special note? e.g. 'Premium location, high visibility area'"
                          value={quoteForm.message}
                          onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={sendingQuote}>
                        <Send size={14} className="mr-2" />
                        {sendingQuote ? "Sending..." : "Quote Bhejo"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Owner: Already sent quotes */}
              {quotes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bheje Huye Quotes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quotes.map(q => (
                      <div key={q._id} className={`p-3 rounded-xl border-2 ${q.status === "accepted" ? "border-green-400 bg-green-50" : q.status === "rejected" ? "border-red-200 bg-red-50" : "border-gray-100"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-black text-gray-900">{formatCurrency(q.amount)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Valid till {formatDate(q.validUntil)}</p>
                            {q.message && <p className="text-sm text-gray-600 mt-1 italic">"{q.message}"</p>}
                          </div>
                          <Badge className={`${getStatusColor(q.status)} text-xs`}>
                            {q.status === "accepted" ? "✅ Accepted" : q.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Owner: Proof submit karo */}
              {booking.status === "payment_done" && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload size={16} className="text-blue-500" />
                      Installation Proof Upload Karo
                    </CardTitle>
                    <p className="text-xs text-gray-500">Payment ho gayi hai. Installation complete karo aur proof bhejo.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => document.getElementById("proof-upload").click()}
                    >
                      <Upload size={24} className="mx-auto text-blue-300 mb-2" />
                      <p className="text-sm text-gray-600">Installation photos select karo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — multiple photos allowed</p>
                      <input
                        id="proof-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => setProofFiles(Array.from(e.target.files))}
                      />
                    </div>
                    {proofFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {proofFiles.map((f, i) => (
                          <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSubmitProof} disabled={proofLoading || !proofFiles.length}>
                      {proofLoading ? "Uploading..." : `Submit Proof (${proofFiles.length} photo${proofFiles.length !== 1 ? "s" : ""})`}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Owner: Waiting states */}
              {booking.status === "quote_received" && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-5 text-center">
                    <Clock size={28} className="text-yellow-500 mx-auto mb-2" />
                    <p className="font-semibold text-yellow-800">Client ka wait karo</p>
                    <p className="text-sm text-yellow-600 mt-1">Client quote review kar raha hai. Accept ya counter offer aane ka wait karo.</p>
                  </CardContent>
                </Card>
              )}
              {booking.status === "confirmed" && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-5 text-center">
                    <Clock size={28} className="text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold text-blue-800">Payment ka wait karo</p>
                    <p className="text-sm text-blue-600 mt-1">Client quote accept kar chuka hai, ab payment karega.</p>
                  </CardContent>
                </Card>
              )}
              {booking.status === "proof_submitted" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-5 text-center">
                    <Clock size={28} className="text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-800">Client approval ka wait karo</p>
                    <p className="text-sm text-green-600 mt-1">Proof submitted hai. Client approve karega to payment release hogi.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════
              CLIENT ACTIONS
          ══════════════════════════════════════════ */}
          {isClient && (
            <>
              {/* Client: Waiting for quote */}
              {booking.status === "quote_requested" && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-5 text-center">
                    <Clock size={28} className="text-yellow-500 mx-auto mb-2" />
                    <p className="font-semibold text-yellow-800">Owner ke quote ka wait karo</p>
                    <p className="text-sm text-yellow-600 mt-1">Owner aapke request pe quote bhejega. Notification aayega.</p>
                  </CardContent>
                </Card>
              )}

              {/* Client: Quotes available — ACCEPT/REJECT */}
              {["quote_received", "confirmed"].includes(booking.status) && quotes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Quotes ({quotes.length}) — {booking.status === "confirmed" ? "Accepted ✅" : "Review Karo"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quotes.map(q => (
                      <div key={q._id} className={`p-4 rounded-xl border-2 transition-all
                        ${q.status === "accepted" ? "border-green-400 bg-green-50"
                        : q.status === "rejected" ? "border-red-200 bg-red-50 opacity-60"
                        : "border-brand-200 bg-orange-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(q.amount)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Valid till {formatDate(q.validUntil)}</p>
                            {q.message && (
                              <div className="mt-2 p-2 bg-white rounded-lg border text-sm text-gray-600 italic">
                                "{q.message}"
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${getStatusColor(q.status)} text-xs`}>
                              {q.status === "accepted" ? "✅ Accepted" : q.status === "rejected" ? "❌ Rejected" : "Pending"}
                            </Badge>
                            {q.status === "sent" && booking.status === "quote_received" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcceptQuote(q._id)}>
                                  <CheckCircle size={13} className="mr-1" />Accept
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-500 hover:bg-red-50" onClick={() => handleRejectQuote(q._id)}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Client: Installation Proof dekho */}
              {booking.installationProof?.images?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Installation Proof</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {booking.installationProof.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img src={img} className="h-28 w-full object-cover rounded-xl hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted: {formatDate(booking.installationProof.submittedAt)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Client: Approve Installation */}
              {booking.status === "proof_submitted" && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      Installation Approve Karo
                    </CardTitle>
                    <p className="text-xs text-gray-500">Upar proof dekho, sahi hai to approve karo — payment release ho jayegi.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Koi remarks? (Optional)"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      rows={2}
                    />
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={approveLoading}>
                      {approveLoading ? "Approving..." : "✅ Approve & Release Payment"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Client: Review (after completed) */}
              {booking.status === "completed" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Review Do</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                          <Star size={24} className={n <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">{reviewForm.rating}/5</span>
                    </div>
                    <Textarea
                      placeholder="Apna experience share karo..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      rows={3}
                    />
                    <Button size="sm" disabled={reviewLoading} onClick={async () => {
                      setReviewLoading(true);
                      try {
                        const { reviewService } = await import("@/services/api");
                        await reviewService.create({ bookingId: id, ...reviewForm });
                        showToast("Review submit ho gaya! Thanks 🙏", "success");
                      } catch (err) {
                        showToast(err.response?.data?.message || "Review failed", "error");
                      } finally { setReviewLoading(false); }
                    }}>
                      {reviewLoading ? "Submitting..." : "Review Submit Karo"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Agreement Section */}
          {booking.agreementId?.pdfUrl && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={22} className="text-brand-500" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Agreement</p>
                    <p className="text-xs text-gray-400">#{booking.agreementId.agreementNumber}</p>
                  </div>
                </div>
                <a href={booking.agreementId.pdfUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <Download size={13} className="mr-1" />Download
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Column: Pricing + Main CTA ── */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Base Amount</span>
                <span>{formatCurrency(booking.pricing?.baseAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Fee</span>
                <span>{formatCurrency(booking.pricing?.platformFee || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span>{formatCurrency(booking.pricing?.gst || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatCurrency(booking.pricing?.totalAmount || 0)}</span>
              </div>
              {isOwner && booking.pricing?.ownerPayout > 0 && (
                <div className="flex justify-between text-green-600 font-semibold pt-1 border-t">
                  <span>Your Payout</span>
                  <span>{formatCurrency(booking.pricing?.ownerPayout)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CLIENT: Main Payment CTA */}
          {isClient && booking.status === "confirmed" && (
            <Card className="border-brand-300 bg-orange-50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Quote accepted! Ab payment karo.</p>
                <p className="text-xs text-gray-500">Secure Razorpay escrow — paisa tabhi release hoga jab aap approve karo.</p>
                <Button className="w-full h-11 text-base" onClick={handlePayment} disabled={paymentLoading}>
                  <CreditCard size={17} className="mr-2" />
                  {paymentLoading ? "Opening Razorpay..." : `Pay ${formatCurrency(booking.pricing?.totalAmount || 0)}`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generate Agreement */}
          {["confirmed","payment_pending","payment_done","proof_submitted","client_approved","completed"].includes(booking.status) && (
            <Button variant="outline" className="w-full" onClick={handleAgreement} disabled={agreementLoading}>
              <FileText size={15} className="mr-2" />
              {agreementLoading ? "Generating..." : booking.agreementId ? "Download Agreement" : "Generate Agreement"}
            </Button>
          )}

          {/* Parties Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {booking.client && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Client</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                      {booking.client.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{booking.client.name}</p>
                      <p className="text-xs text-gray-400 truncate">{booking.client.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {booking.owner && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-400 mb-1.5">Owner</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-600 flex-shrink-0">
                      {booking.owner.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.owner.businessDetails?.agencyName || booking.owner.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{booking.owner.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Button */}
          {!["cancelled","completed"].includes(booking.status) && (
            <Button variant="outline" className="w-full" onClick={() => window.open(`/chat/${booking._id}`, "_blank")}>
              <MessageCircle size={15} className="mr-2" />Chat with {isClient ? "Owner" : "Client"}
            </Button>
          )}

          {/* Cancel Button */}
          {["quote_requested","quote_received","confirmed"].includes(booking.status) && (
            <Button variant="ghost" size="sm" className="w-full text-red-400 hover:text-red-600 hover:bg-red-50" onClick={handleCancel}>
              Booking Cancel Karo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
