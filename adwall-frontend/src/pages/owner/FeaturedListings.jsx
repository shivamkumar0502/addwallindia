import { useState } from "react";
import { hoardingService } from "@/services/api";
import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import useToast from "@/hooks/useToast";
import Loader from "@/components/common/Loader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Star, Zap, TrendingUp, Crown } from "lucide-react";

const BADGES = [
  { value: "hot", label: "🔥 Hot", desc: "High demand area" },
  { value: "trending", label: "📈 Trending", desc: "Most viewed this week" },
  { value: "premium", label: "👑 Premium", desc: "Top quality location" },
];

const PLANS = [
  { months: 1, label: "1 Month", price: 999, discount: 0 },
  { months: 3, label: "3 Months", price: 2699, discount: 10, popular: true },
  { months: 6, label: "6 Months", price: 4999, discount: 17 },
];

const FeaturedListings = () => {
  const { toast, showToast } = useToast();
  const { data: hoardings, loading } = useFetch(hoardingService.getMyHoardings);
  const [selectedHoarding, setSelectedHoarding] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [selectedBadge, setSelectedBadge] = useState("premium");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleFeature = async () => {
    if (!selectedHoarding) { showToast("Pehle hoarding select karo", "error"); return; }
    setPaymentLoading(true);

    try {
      // Load Razorpay
      const loaded = await new Promise(resolve => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
      });

      if (!loaded) { showToast("Razorpay load nahi hua", "error"); return; }

      const { data } = await api.post("/featured/create-order", {
        hoardingId: selectedHoarding._id,
        months: selectedPlan.months,
        badge: selectedBadge,
      });

      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "AdWall India",
        description: `Featured Listing — ${selectedPlan.label}`,
        order_id: data.data.orderId,
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            await api.post("/featured/verify", {
              ...response,
              hoardingId: selectedHoarding._id,
              months: selectedPlan.months,
              badge: selectedBadge,
            });
            showToast(`Hoarding ${selectedPlan.months} months ke liye featured ho gayi! 🎉`, "success");
            setSelectedHoarding(null);
          } catch {
            showToast("Verification failed", "error");
          }
        },
        modal: { ondismiss: () => showToast("Payment cancelled", "error") },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      showToast(err.response?.data?.message || "Order failed", "error");
    } finally { setPaymentLoading(false); }
  };

  const verifiedHoardings = hoardings?.filter(h => h.verificationStatus === "verified") || [];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {toast && <Toast {...toast} onClose={() => {}} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-black flex items-center gap-2"><Crown size={24} />Featured Listings</h1>
        <p className="text-orange-100 mt-1">Apni hoarding ko top pe dikhao — zyada visibility, zyada bookings!</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { icon: <TrendingUp size={18} />, text: "5x More Views" },
            { icon: <Star size={18} />, text: "Top Search Results" },
            { icon: <Zap size={18} />, text: "Priority Listing" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
              {icon}{text}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Select Hoarding */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900">Hoarding Select Karo</h2>
          {loading ? <Loader /> : verifiedHoardings.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border rounded-xl">
              <p className="text-sm">Koi verified hoarding nahi hai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifiedHoardings.map(h => (
                <button
                  key={h._id}
                  onClick={() => setSelectedHoarding(h)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                    ${selectedHoarding?._id === h._id ? "border-brand-500 bg-orange-50" : "border-gray-100 hover:border-gray-300"}`}
                >
                  <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {h.images?.[0] ? <img src={h.images[0]} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🪧</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{h.title}</p>
                    <p className="text-xs text-gray-500">{h.location?.city}</p>
                    {h.isFeatured && (
                      <Badge className="text-xs bg-orange-100 text-orange-700 mt-1">
                        Featured until {formatDate(h.featuredUntil)}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Badge Select */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Badge Select Karo</h3>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setSelectedBadge(b.value)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${selectedBadge === b.value ? "border-brand-500 bg-orange-50" : "border-gray-100"}`}
                >
                  <div className="text-lg">{b.label.split(" ")[0]}</div>
                  <div className="text-xs font-medium mt-0.5">{b.label.split(" ").slice(1).join(" ")}</div>
                  <div className="text-[10px] text-gray-400">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900">Plan Select Karo</h2>
          <div className="space-y-3">
            {PLANS.map(plan => (
              <button
                key={plan.months}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative
                  ${selectedPlan.months === plan.months ? "border-brand-500 bg-orange-50" : "border-gray-100 hover:border-gray-300"}`}
              >
                {plan.popular && (
                  <span className="absolute top-2 right-2 text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">Most Popular</span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{plan.label}</p>
                    {plan.discount > 0 && <p className="text-xs text-green-600">Save {plan.discount}%</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-600">{formatCurrency(plan.price)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(Math.round(plan.price / plan.months))}/month</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Summary + Pay */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Hoarding</span>
                  <span className="font-medium truncate max-w-[150px]">{selectedHoarding?.title || "Not selected"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Duration</span>
                  <span className="font-medium">{selectedPlan.label}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Badge</span>
                  <span>{BADGES.find(b => b.value === selectedBadge)?.label}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-brand-600">{formatCurrency(selectedPlan.price)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleFeature}
                disabled={!selectedHoarding || paymentLoading}
              >
                <Crown size={16} className="mr-2" />
                {paymentLoading ? "Processing..." : "Feature My Hoarding"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default FeaturedListings;
