import { useCallback } from "react";
import RazorpayCheckout from "react-native-razorpay";
import { Alert } from "react-native";

/**
 * Generic Razorpay RN payment trigger.
 * `orderData` must already contain { keyId, amount, currency, orderId }
 * (i.e. call your backend's create-order endpoint first, then pass the
 * response here). On success this returns the raw Razorpay response
 * ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) so the
 * caller can POST it to their own /verify endpoint.
 */
export default function usePayment() {
  const pay = useCallback(async ({ orderData, name = "AdWall India", description = "" }) => {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name,
      description,
      order_id: orderData.orderId,
      theme: { color: "#f97316" },
    };
    try {
      const data = await RazorpayCheckout.open(options);
      return data; // { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    } catch (error) {
      // error.code === 0 means user cancelled the payment sheet
      if (error?.code !== 0) {
        Alert.alert("Payment Failed", error?.description || "Kuch gadbad ho gayi, dobara try karo");
      }
      return null;
    }
  }, []);

  return { pay };
}
