import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hoardingService, bookingService, reviewService } from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Star, Eye, Ruler, Zap, Calendar, CheckCircle, ArrowLeft } from "lucide-react";

const HoardingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [bookingForm, setBookingForm] = useState({ startDate: "", endDate: "", requirements: "" });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const { data: hoarding, loading } = useFetch(() => hoardingService.getById(id));
  const { data: reviews } = useFetch(() => reviewService.getByHoarding(id));

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate("/login");
    setBooking(true); setBookingError("");
    try {
      await bookingService.create({ hoardingId: id, ...bookingForm });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.response?.data?.message || "Booking failed");
    } finally { setBooking(false); }
  };

  if (loading) return <Loader className="min-h-screen" size="lg" />;
  if (!hoarding) return <div className="min-h-screen flex items-center justify-center text-gray-500">Hoarding not found</div>;

  const days = bookingForm.startDate && bookingForm.endDate
    ? Math.ceil((new Date(bookingForm.endDate) - new Date(bookingForm.startDate)) / 86400000)
    : 0;
  const estimatedCost = days > 0 ? Math.ceil((hoarding.pricing.perMonth / 30) * days) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} />Back to Search
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <div className="h-80 md:h-96 relative">
                {hoarding.images?.[activeImg] ? (
                  <img src={hoarding.images[activeImg]} alt={hoarding.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">🪧</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-white/90 text-gray-700 text-xs">{hoarding.category?.replace(/_/g, " ").toUpperCase()}</Badge>
                  {hoarding.lighting === "led" && <Badge className="text-xs"><Zap size={10} className="inline mr-1" />LED</Badge>}
                </div>
              </div>
              {hoarding.images?.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {hoarding.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-brand-500" : "border-transparent"}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{hoarding.title}</h1>
                    <div className="flex items-center gap-1 mt-2 text-gray-500">
                      <MapPin size={16} /><span>{hoarding.location?.area}, {hoarding.location?.city}</span>
                    </div>
                  </div>
                  {hoarding.rating > 0 && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-900">{hoarding.rating}</span>
                      <span className="text-gray-400 text-xs">({hoarding.totalReviews})</span>
                    </div>
                  )}
                </div>

                {hoarding.description && <p className="text-gray-600 text-sm mb-4">{hoarding.description}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Ruler size={16} />, label: "Size", value: `${hoarding.dimensions?.width}×${hoarding.dimensions?.height} ft` },
                    { icon: <Eye size={16} />, label: "Traffic", value: hoarding.dailyTraffic?.replace("_", " ") },
                    { icon: <Zap size={16} />, label: "Lighting", value: hoarding.lighting },
                    { icon: <MapPin size={16} />, label: "Facing", value: hoarding.facingDirection || "N/A" },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">{icon}{label}</div>
                      <div className="font-semibold text-gray-900 text-sm capitalize">{value}</div>
                    </div>
                  ))}
                </div>

                {hoarding.landmarkNearby && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
                    <MapPin size={14} className="text-blue-500" />
                    Near: <span className="font-medium text-blue-700">{hoarding.landmarkNearby}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {hoarding.pricing?.perDay && <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-gray-900">{formatCurrency(hoarding.pricing.perDay)}</div><div className="text-xs text-gray-500 mt-1">Per Day</div></div>}
                  {hoarding.pricing?.perWeek && <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-gray-900">{formatCurrency(hoarding.pricing.perWeek)}</div><div className="text-xs text-gray-500 mt-1">Per Week</div></div>}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200"><div className="text-lg font-bold text-brand-600">{formatCurrency(hoarding.pricing.perMonth)}</div><div className="text-xs text-brand-500 mt-1">Per Month</div></div>
                </div>
                {hoarding.pricing?.isNegotiable && <p className="text-xs text-green-600 mt-3 flex items-center gap-1"><CheckCircle size={12} />Price is negotiable</p>}
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Reviews ({reviews.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map(r => (
                    <div key={r._id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">{r.client?.name?.[0]}</div>
                          <span className="font-medium text-sm text-gray-900">{r.client?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                      {r.ownerReply && <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600"><span className="font-medium">Owner:</span> {r.ownerReply}</div>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader><CardTitle className="text-base">Book This Space</CardTitle></CardHeader>
                <CardContent>
                  {bookingSuccess ? (
                    <div className="text-center py-6">
                      <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900">Quote Request Sent!</h3>
                      <p className="text-sm text-gray-500 mt-2">Owner will respond with a quote soon.</p>
                      <Button className="mt-4 w-full" onClick={() => navigate("/client/bookings")}>My Bookings Dekho</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleBooking} className="space-y-4">
                      {bookingError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{bookingError}</div>}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1"><Calendar size={14} />Start Date</label>
                        <Input type="date" value={bookingForm.startDate} onChange={e => setBookingForm(f => ({ ...f, startDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1"><Calendar size={14} />End Date</label>
                        <Input type="date" value={bookingForm.endDate} onChange={e => setBookingForm(f => ({ ...f, endDate: e.target.value }))} min={bookingForm.startDate} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Requirements (optional)</label>
                        <Textarea placeholder="Kuch special requirements hain? Creative size, design brief etc." value={bookingForm.requirements} onChange={e => setBookingForm(f => ({ ...f, requirements: e.target.value }))} rows={3} />
                      </div>
                      {days > 0 && (
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex justify-between text-sm"><span className="text-gray-600">{days} days</span><span className="font-semibold text-brand-600">{formatCurrency(estimatedCost)}</span></div>
                          <p className="text-xs text-gray-400 mt-1">+ platform fee + GST (final quote owner se aayega)</p>
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={booking || !isAuthenticated}>
                        {booking ? "Sending..." : isAuthenticated ? "Quote Request Bhejo" : "Login karke Book Karo"}
                      </Button>
                      {!isAuthenticated && <p className="text-xs text-center text-gray-400">Booking ke liye login required hai</p>}
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Owner Card */}
              {hoarding.owner && (
                <Card className="mt-4">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-600">{hoarding.owner.name?.[0]}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{hoarding.owner.businessDetails?.agencyName || hoarding.owner.name}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} />Verified Owner</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HoardingDetail;
