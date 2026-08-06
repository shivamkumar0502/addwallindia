import { useCallback } from "react";
import { paymentService } from "@/services/api";

const useRazorpay = () => {
  const loadScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const initiatePayment = useCallback(async ({ bookingId, userName, userEmail, userMobile, onSuccess, onError }) => {
    const loaded = await loadScript();
    if (!loaded) { onError?.("Razorpay load nahi hua"); return; }
    try {
      const { data } = await paymentService.createOrder({ bookingId });
      const { orderId, amount, currency, keyId } = data.data;
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount, currency,
        name: "AdWall India",
        description: "Advertising Space Booking",
        order_id: orderId,
        prefill: { name: userName, email: userEmail, contact: userMobile },
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            await paymentService.verify(response);
            onSuccess?.(response);
          } catch (err) { onError?.(err.response?.data?.message || "Verify failed"); }
        },
        modal: { ondismiss: () => onError?.("Payment cancelled") },
      };
      new window.Razorpay(options).open();
    } catch (err) { onError?.(err.response?.data?.message || "Order failed"); }
  }, []);

  return { initiatePayment };
};
export default useRazorpay;
