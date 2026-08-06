import { useState } from "react";
import api from "@/services/api";
import useFetch from "@/hooks/useFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import useToast from "@/hooks/useToast";
import Loader from "@/components/common/Loader";
import { formatDate } from "@/lib/utils";
import { CheckCircle, Crown, Zap, Shield } from "lucide-react";

const PLAN_ICONS = { free: "🆓", pro: "⚡", business: "👑" };
const PLAN_COLORS = {
  free: "border-gray-200",
  pro: "border-brand-400 shadow-lg shadow-orange-100",
  business: "border-yellow-400 shadow-lg shadow-yellow-100",
};

const SubscriptionPage = () => {
  const { toast, showToast } = useToast();
  const [upgrading, setUpgrading] = useState(null);

  const { data: subData, loading: subLoading, execute: refetch } = useFetch(
    () => api.get("/subscriptions/me").then(r => r.data.data)
  );
  const { data: plans } = useFetch(() => api.get("/subscriptions/plans").then(r => r.data.data));

  const handleUpgrade = async (planKey) => {
    setUpgrading(planKey);
    try {
      const loaded = await new Promise(resolve => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
      });
      if (!loaded) { showToast("Razorpay load nahi hua", "error"); return; }

      const { data } = await api.post("/subscriptions/upgrade", { plan: planKey });
      const order = data.data;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "AdWall India",
        description: `${order.planDetails.name} Subscription — 1 Month`,
        order_id: order.orderId,
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            await api.post("/subscriptions/verify", { ...response, plan: planKey });
            showToast(`${order.planDetails.name} plan activate ho gaya! 🎉`, "success");
            refetch();
          } catch { showToast("Verification failed", "error"); }
        },
        modal: { ondismiss: () => showToast("Payment cancelled", "error") },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showToast(err.response?.data?.message || "Order failed", "error");
    } finally { setUpgrading(null); }
  };

  if (subLoading) return <Loader className="py-24" size="lg" />;

  const currentPlan = subData?.plan || "free";
  const planDetails = subData?.planDetails;

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {toast && <Toast {...toast} onClose={() => {}} />}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-2">Plan upgrade karo — zyada listings, kam commission, priority support</p>
      </div>

      {/* Current Plan Banner */}
      <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${PLAN_COLORS[currentPlan]}`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{PLAN_ICONS[currentPlan]}</div>
          <div>
            <p className="font-bold text-gray-900">Current Plan: {planDetails?.name}</p>
            {subData?.endDate && (
              <p className="text-sm text-gray-500">Valid until {formatDate(subData.endDate)}</p>
            )}
          </div>
        </div>
        <Badge className={currentPlan === "free" ? "bg-gray-100 text-gray-600" : "bg-brand-100 text-brand-700"}>
          {currentPlan === "free" ? "Free" : "Active"}
        </Badge>
      </div>

      {/* Plans Grid */}
      {plans && (
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const isPopular = key === "pro";

            return (
              <div key={key} className={`relative rounded-2xl border-2 p-6 ${PLAN_COLORS[key]} bg-white`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">{PLAN_ICONS[key]}</div>
                  <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                  {plan.price === 0 ? (
                    <p className="text-3xl font-black text-gray-900 mt-2">Free</p>
                  ) : (
                    <div className="mt-2">
                      <span className="text-3xl font-black text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-400 text-sm">/month</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    { icon: "🪧", text: plan.hoardingLimit >= 999 ? "Unlimited listings" : `${plan.hoardingLimit} listings` },
                    { icon: "💸", text: `${plan.commissionPercent}% platform commission` },
                    { icon: "👑", text: "Featured listings", enabled: plan.featuredAllowed },
                    { icon: "📊", text: "Analytics access", enabled: plan.analyticsAccess },
                    { icon: "🎯", text: "Priority support", enabled: plan.prioritySupport },
                  ].map(({ icon, text, enabled }) => (
                    <li key={text} className={`flex items-center gap-2 text-sm ${enabled === false ? "text-gray-300" : "text-gray-700"}`}>
                      <span className={enabled === false ? "opacity-30" : ""}>{icon}</span>
                      <span className={enabled === false ? "line-through" : ""}>{text}</span>
                      {enabled === true && <CheckCircle size={13} className="text-green-500 ml-auto" />}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button className="w-full" disabled variant="outline">Current Plan ✓</Button>
                ) : plan.price === 0 ? (
                  <Button className="w-full" disabled variant="outline">Downgrade</Button>
                ) : (
                  <Button
                    className={`w-full ${key === "business" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                    onClick={() => handleUpgrade(key)}
                    disabled={upgrading === key}
                  >
                    {upgrading === key ? "Processing..." : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Commission comparison */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-center">Commission Savings Calculator</h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          {[
            { plan: "Free (12%)", booking: 10000, commission: 1200, save: 0, color: "text-gray-600" },
            { plan: "Pro (10%)", booking: 10000, commission: 1000, save: 200, color: "text-brand-600" },
            { plan: "Business+ (8%)", booking: 10000, commission: 800, save: 400, color: "text-yellow-600" },
          ].map(({ plan, booking, commission, save, color }) => (
            <div key={plan} className="bg-white rounded-xl p-4 border">
              <p className={`font-bold text-sm ${color}`}>{plan}</p>
              <p className="text-xs text-gray-400 mt-1">₹{booking.toLocaleString()} booking pe</p>
              <p className="text-lg font-black text-gray-900 mt-2">₹{commission}</p>
              <p className="text-xs text-gray-500">commission</p>
              {save > 0 && <p className="text-xs text-green-600 font-medium mt-1">Save ₹{save}/booking</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SubscriptionPage;
