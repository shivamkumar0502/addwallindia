import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
// import Constants from "expo-constants";

console.log("Expo Config =", Constants.expoConfig?.extra);
console.log("API URL =", Constants.expoConfig?.extra?.apiUrl);
// Set the correct base URL for your setup:
// - Android Emulator -> http://10.0.2.2:5000/api  (already default in app.json)
// - Real Android device on same WiFi -> http://<your-computer-LAN-IP>:5000/api
const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.6:5002/api";
// const API_URL = "http://192.168.1.5:5002/api";

console.log("API URL =", API_URL);
const api = axios.create({
  baseURL: API_URL,
});

// Har request me access token automatically add karo
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// NOTE: web version refreshes the access token using an httpOnly cookie
// (res.cookie("refreshToken", ...)). React Native has no shared cookie jar
// for axios, so cookie-based refresh won't work here as-is. Simplest and
// most reliable fix on mobile: when a 401 hits, clear session and send the
// user back to Login. (If you want silent refresh on mobile, the backend's
// /auth/refresh route needs to also accept the refresh token in the request
// body/header for RN clients — happy to add that on the backend if you want.)
let onAuthFail = null;
export const setOnAuthFail = (fn) => { onAuthFail = fn; };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["accessToken", "adwall_user"]);
      if (onAuthFail) onAuthFail();
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Service functions (same shape as the website's services) ---
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (data) => api.post("/auth/google", data),
  logout: () => api.post("/auth/logout"),
};

export const hoardingService = {
  search: (params) => api.get("/hoardings", { params }),
  getById: (id) => api.get(`/hoardings/${id}`),
  getMyHoardings: () => api.get("/hoardings/my/listings"),
  add: (formData) => api.post("/hoardings", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => api.patch(`/hoardings/${id}`, data),
  getPending: () => api.get("/hoardings/admin/pending"),
  verify: (id, data) => api.patch(`/hoardings/${id}/verify`, data),
};

export const bookingService = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: (params) => api.get("/bookings/my", { params }),
  getOwnerBookings: (params) => api.get("/bookings/owner", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  submitProof: (id, formData) => api.post(`/bookings/${id}/proof`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  approve: (id, data) => api.post(`/bookings/${id}/approve`, data),
  cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data),
  adminGetAll: (params) => api.get("/bookings/admin/all", { params }),
};

export const quoteService = {
  send: (data) => api.post("/quotes", data),
  accept: (id) => api.post(`/quotes/${id}/accept`),
  reject: (id) => api.post(`/quotes/${id}/reject`),
  counter: (id, data) => api.post(`/quotes/${id}/counter`, data),
  getByBooking: (bookingId) => api.get(`/quotes/booking/${bookingId}`),
};

export const paymentService = {
  createOrder: (data) => api.post("/payments/create-order", data),
  verify: (data) => api.post("/payments/verify", data),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
};

export const kycService = {
  submit: (formData) => api.post("/kyc/submit", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getStatus: () => api.get("/kyc/status"),
  getPending: () => api.get("/kyc/pending"),
  review: (userId, data) => api.patch(`/kyc/${userId}/review`, data),
};

export const walletService = {
  getWallet: () => api.get("/wallet"),
  getTransactions: (params) => api.get("/wallet/transactions", { params }),
};

export const analyticsService = {
  getAdminStats: () => api.get("/analytics/admin"),
  getOwnerStats: () => api.get("/analytics/owner"),
  getClientStats: () => api.get("/analytics/client"),
};

export const campaignService = {
  create: (data) => api.post("/campaigns", data),
  getMyCampaigns: () => api.get("/campaigns/my"),
  getById: (id) => api.get(`/campaigns/${id}`),
  close: (id) => api.patch(`/campaigns/${id}/close`),
};

export const reviewService = {
  create: (data) => api.post("/reviews", data),
  getByHoarding: (hoardingId) => api.get(`/reviews/hoarding/${hoardingId}`),
  reply: (id, data) => api.post(`/reviews/${id}/reply`, data),
};

export const notificationService = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const agreementService = {
  generate: (bookingId) => api.post(`/agreements/generate/${bookingId}`),
  getByBooking: (bookingId) => api.get(`/agreements/booking/${bookingId}`),
  sign: (id) => api.post(`/agreements/${id}/sign`),
};
