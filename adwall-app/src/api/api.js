import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// FIX: pehle default LAN IP (192.168.x.x:5002) tha — Expo Go / Play Store
// build me backend kabhi connect nahi hota tha. Ab live Render URL default hai.
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  "https://addwallindia-2.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Render free tier cold start slow hota hai
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onAuthFail = null;
export const setOnAuthFail = (fn) => { onAuthFail = fn; };

// FIX: RN me cookie jar nahi hai, isliye refresh token AsyncStorage se
// body me bhejo. Backend /auth/refresh already body/header accept karta hai.
let isRefreshing = false;
let queue = [];
const flush = (err, token) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  queue = [];
};

const clearSession = async () => {
  await AsyncStorage.multiRemove(["accessToken", "refreshToken", "adwall_user"]);
  if (onAuthFail) onAuthFail();
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      // Network error — user ko saaf message do
      error.friendlyMessage =
        "Server se connect nahi ho paya. Internet check karo ya thodi der baad try karo.";
      return Promise.reject(error);
    }

    if (error.response.status === 401 && original && !original._retry) {
      if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/login")) {
        await clearSession();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("no refresh token");

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "x-refresh-token": refreshToken } }
        );

        const newToken = data.data.accessToken;
        await AsyncStorage.setItem("accessToken", newToken);
        if (data.data.refreshToken)
          await AsyncStorage.setItem("refreshToken", data.data.refreshToken);

        flush(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        flush(e, null);
        await clearSession();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Service functions (same shape as the website's services) ---
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (token) => api.post("/auth/google", { token }),
  googleComplete: (data) => api.post("/auth/google/complete", data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// OTP — register verification + password reset (naya, web se match karta hai)
export const otpService = {
  sendRegisterOtp: (data) => api.post("/otp/send-register-otp", data),
  verifyRegisterOtp: (data) => api.post("/otp/verify-register-otp", data),
  forgotPassword: (email) => api.post("/otp/forgot-password", { email }),
  resetPassword: (data) => api.post("/otp/reset-password", data),
  sendMobileOtp: (mobile) => api.post("/otp/send-mobile-otp", { mobile }),
  verifyMobileOtp: (data) => api.post("/otp/verify-mobile", data),
};

export const contactService = {
  send: (data) => api.post("/contact", data),
};

export const hoardingService = {
  search: (params) => api.get("/hoardings", { params }), // lat/lng/radius bhi bhej sakte ho
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