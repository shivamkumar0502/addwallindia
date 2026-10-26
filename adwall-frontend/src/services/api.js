// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
//   withCredentials: true, // cookies (refresh token) ke liye
// });

// // Har request me access token automatically add karo
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // 401 aane pe refresh token se naya access token lo
// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error.config;
//     if (error.response?.status === 401 && !original._retry) {
//       original._retry = true;
//       try {
//         const { data } = await axios.post(
//           `${import.meta.env.VITE_API_URL}/auth/refresh`,
//           {},
//           { withCredentials: true }
//         );
//         localStorage.setItem("accessToken", data.data.accessToken);
//         original.headers.Authorization = `Bearer ${data.data.accessToken}`;
//         return api(original);
//       } catch {
//         localStorage.removeItem("accessToken");
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

// // --- Service functions ---
// export const authService = {
//   register: (data) => api.post("/auth/register", data),
//   login: (data) => api.post("/auth/login", data),
//   googleLogin: (data) => api.post("/auth/google", data),
//   logout: () => api.post("/auth/logout"),
// };

// export const hoardingService = {
//   search: (params) => api.get("/hoardings", { params }),
//   getById: (id) => api.get(`/hoardings/${id}`),
//   getMyHoardings: () => api.get("/hoardings/my/listings"),
//   add: (formData) => api.post("/hoardings", formData, { headers: { "Content-Type": "multipart/form-data" } }),
//   update: (id, data) => api.patch(`/hoardings/${id}`, data),
//   getPending: () => api.get("/hoardings/admin/pending"),
//   verify: (id, data) => api.patch(`/hoardings/${id}/verify`, data),
// };

// export const bookingService = {
//   create: (data) => api.post("/bookings", data),
//   getMyBookings: (params) => api.get("/bookings/my", { params }),
//   getOwnerBookings: (params) => api.get("/bookings/owner", { params }),
//   getById: (id) => api.get(`/bookings/${id}`),
//   submitProof: (id, formData) => api.post(`/bookings/${id}/proof`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
//   approve: (id, data) => api.post(`/bookings/${id}/approve`, data),
//   cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data),
//   adminGetAll: (params) => api.get("/bookings/admin/all", { params }),
// };

// export const quoteService = {
//   send: (data) => api.post("/quotes", data),
//   accept: (id) => api.post(`/quotes/${id}/accept`),
//   reject: (id) => api.post(`/quotes/${id}/reject`),
//   counter: (id, data) => api.post(`/quotes/${id}/counter`, data),
//   getByBooking: (bookingId) => api.get(`/quotes/booking/${bookingId}`),
// };

// export const paymentService = {
//   createOrder: (data) => api.post("/payments/create-order", data),
//   verify: (data) => api.post("/payments/verify", data),
//   getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
// };

// export const kycService = {
//   submit: (formData) => api.post("/kyc/submit", formData, { headers: { "Content-Type": "multipart/form-data" } }),
//   getStatus: () => api.get("/kyc/status"),
//   getPending: () => api.get("/kyc/pending"),
//   review: (userId, data) => api.patch(`/kyc/${userId}/review`, data),
// };

// export const walletService = {
//   getWallet: () => api.get("/wallet"),
//   getTransactions: (params) => api.get("/wallet/transactions", { params }),
// };

// export const analyticsService = {
//   getAdminStats: () => api.get("/analytics/admin"),
//   getOwnerStats: () => api.get("/analytics/owner"),
//   getClientStats: () => api.get("/analytics/client"),
// };

// export const campaignService = {
//   create: (data) => api.post("/campaigns", data),
//   getMyCampaigns: () => api.get("/campaigns/my"),
//   getById: (id) => api.get(`/campaigns/${id}`),
//   close: (id) => api.patch(`/campaigns/${id}/close`),
// };

// export const reviewService = {
//   create: (data) => api.post("/reviews", data),
//   getByHoarding: (hoardingId) => api.get(`/reviews/hoarding/${hoardingId}`),
//   reply: (id, data) => api.post(`/reviews/${id}/reply`, data),
// };

// export const notificationService = {
//   getAll: (params) => api.get("/notifications", { params }),
//   markRead: (id) => api.patch(`/notifications/${id}/read`),
//   markAllRead: () => api.patch("/notifications/read-all"),
// };

// export const aiService = {
//   visibilityScore: (id) => api.get(`/ai/visibility-score/${id}`),
//   priceRecommendation: (id) => api.get(`/ai/price-recommendation/${id}`),
//   mediaPlan: (data) => api.post("/ai/media-planner", data),
//   budgetPlan: (data) => api.post("/ai/budget-planner", data),
// };

// export const agreementService = {
//   generate: (bookingId) => api.post(`/agreements/generate/${bookingId}`),
//   getByBooking: (bookingId) => api.get(`/agreements/booking/${bookingId}`),
//   sign: (id) => api.post(`/agreements/${id}/sign`),
// };

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — token attach karo ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// ── Response interceptor — 401 pe auto refresh ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Sign-in failures are not expired application sessions. Refreshing here
    // used to replace Google's useful error with a page redirect to /login.
    const publicAuthRequest = /\/auth\/(login|register|google(?:\/complete)?|refresh)(?:[?#]|$)/.test(original?.url || "");
    if (error.response?.status === 401 && original && !publicAuthRequest && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(`${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        if (data.data.refreshToken) localStorage.setItem("refreshToken", data.data.refreshToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);

export default api;

// ────────────────────────────────────────
// AUTH
// ────────────────────────────────────────
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  getMe: () => api.get("/auth/me"),
  googleLogin: (token) => api.post("/auth/google", { token }),
  googleComplete: (data) => api.post("/auth/google/complete", data),
};

// ────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────
export const profileService = {
  getProfile: () => api.get("/profile/me"),
  updateProfile: (fd) => api.patch("/profile/update", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (data) => api.patch("/profile/change-password", data),
  deleteAccount: (data) => api.delete("/profile/delete", { data }),
};

// ────────────────────────────────────────
// HOARDINGS
// ────────────────────────────────────────
export const hoardingService = {
  search: (params) => api.get("/hoardings", { params }),
  getById: (id) => api.get(`/hoardings/${id}`),
  getMyHoardings: () => api.get("/hoardings/my/listings"),
  add: (fd) => api.post("/hoardings", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, fd) => api.put(`/hoardings/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => api.delete(`/hoardings/${id}`),
  verify: (id, data) => api.patch(`/hoardings/${id}/verify`, data),
  getPending: () => api.get("/hoardings/admin/pending"),
};

// ────────────────────────────────────────
// BOOKINGS
// ────────────────────────────────────────
export const bookingService = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: (params) => api.get("/bookings/my", { params }),
  getOwnerBookings: (params) => api.get("/bookings/owner", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  submitProof: (id, fd) => api.post(`/bookings/${id}/proof`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  approve: (id, data) => api.post(`/bookings/${id}/approve`, data),
  cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data),
  adminGetAll: (params) => api.get("/bookings/admin/all", { params }),
};

// ────────────────────────────────────────
// QUOTES
// ────────────────────────────────────────
export const quoteService = {
  send: (data) => api.post("/quotes", data),
  accept: (id) => api.post(`/quotes/${id}/accept`),
  reject: (id) => api.post(`/quotes/${id}/reject`),
  counter: (id, data) => api.post(`/quotes/${id}/counter`, data),
  getByBooking: (bookingId) => api.get(`/quotes/booking/${bookingId}`),
};

// ────────────────────────────────────────
// PAYMENTS
// ────────────────────────────────────────
export const paymentService = {
  createOrder: (data) => api.post("/payments/create-order", data),
  verify: (data) => api.post("/payments/verify", data),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  adminGetAll: (params) => api.get("/payments/admin/all", { params }),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

// ────────────────────────────────────────
// WALLET
// ────────────────────────────────────────
export const walletService = {
  getWallet: () => api.get("/wallet"),
  getTransactions: (params) => api.get("/wallet/transactions", { params }),
  adminGetUserWallet: (userId) => api.get(`/wallet/admin/${userId}`),
};

// ────────────────────────────────────────
// KYC
// ────────────────────────────────────────
export const kycService = {
  submit: (fd) => api.post("/kyc/submit", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  getStatus: () => api.get("/kyc/status"),
  getPending: () => api.get("/kyc/pending"),
  review: (id, data) => api.patch(`/kyc/${id}/review`, data),
};

// ────────────────────────────────────────
// REVIEWS ← (ye missing tha)
// ────────────────────────────────────────
export const reviewService = {
  create: (data) => api.post("/reviews", data),
  getByHoarding: (hoardingId) => api.get(`/reviews/hoarding/${hoardingId}`),
  reply: (id, data) => api.post(`/reviews/${id}/reply`, data),
};

// ────────────────────────────────────────
// AGREEMENTS
// ────────────────────────────────────────
export const agreementService = {
  // FIX: backend route POST /agreements/generate/:bookingId hai (URL me),
  // yahan bookingId body me bheja jaa raha tha -> "Route not found"
  generate: (bookingId) => api.post(`/agreements/generate/${bookingId}`),
  getByBooking: (bookingId) => api.get(`/agreements/booking/${bookingId}`),
  sign: (id) => api.post(`/agreements/${id}/sign`), // FIX: backend POST expect karta hai, PATCH nahi
};

// ────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────
export const notificationService = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// ────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────
export const analyticsService = {
  getAdminStats: () => api.get("/analytics/admin"),
  getOwnerStats: () => api.get("/analytics/owner"),
  getClientStats: () => api.get("/analytics/client"),
};

// ────────────────────────────────────────
// CAMPAIGNS
// ────────────────────────────────────────
export const campaignService = {
  create: (data) => api.post("/campaigns", data),
  getMyCampaigns: () => api.get("/campaigns/my"),
  getById: (id) => api.get(`/campaigns/${id}`),
  close: (id) => api.patch(`/campaigns/${id}/close`),
  adminGetAll: () => api.get("/campaigns/admin/all"),
};

// ────────────────────────────────────────
// AI FEATURES
// ────────────────────────────────────────
export const aiService = {
  visibilityScore: (data) => api.post("/ai/visibility-score", data),
  priceRecommendation: (data) => api.post("/ai/price-recommendation", data),
  mediaPlanner: (data) => api.post("/ai/media-planner", data),
  budgetPlanner: (data) => api.post("/ai/budget-planner", data),
};

// ────────────────────────────────────────
// CHATBOT (Gemini)
// ────────────────────────────────────────
export const chatbotService = {
  sendMessage: (data) => api.post("/chatbot/message", data),
  getSuggestions: () => api.get("/chatbot/suggestions"),
};

// ────────────────────────────────────────
// CHAT (Real-time)
// ────────────────────────────────────────
export const chatService = {
  getConversation: (bookingId) => api.get(`/chat/booking/${bookingId}`),
  getMessages: (convId, params) => api.get(`/chat/${convId}/messages`, { params }),
  sendMessage: (convId, data) => api.post(`/chat/${convId}/send`, data),
  getMyConversations: () => api.get("/chat/my"),
};

// ────────────────────────────────────────
// FEATURED LISTINGS
// ────────────────────────────────────────
export const featuredService = {
  getFeatured: () => api.get("/featured"),
  createOrder: (data) => api.post("/featured/create-order", data),
  verify: (data) => api.post("/featured/verify", data),
  adminSet: (id, data) => api.patch(`/featured/${id}/admin-set`, data),
};

// ────────────────────────────────────────
// COUPONS
// ────────────────────────────────────────
export const couponService = {
  validate: (data) => api.post("/coupons/validate", data),
  apply: (data) => api.post("/coupons/apply", data),
  adminGetAll: () => api.get("/coupons/admin"),
  adminCreate: (data) => api.post("/coupons/admin", data),
  adminToggle: (id) => api.patch(`/coupons/admin/${id}/toggle`),
  adminDelete: (id) => api.delete(`/coupons/admin/${id}`),
};

// ────────────────────────────────────────
// SUBSCRIPTIONS
// ────────────────────────────────────────
export const subscriptionService = {
  getPlans: () => api.get("/subscriptions/plans"),
  getMySubscription: () => api.get("/subscriptions/me"),
  createUpgradeOrder: (data) => api.post("/subscriptions/upgrade", data),
  verify: (data) => api.post("/subscriptions/verify", data),
  adminGetAll: () => api.get("/subscriptions/admin/all"),
};

// ────────────────────────────────────────
// AVAILABILITY CALENDAR
// ────────────────────────────────────────
export const availabilityService = {
  get: (hoardingId, params) => api.get(`/availability/${hoardingId}`, { params }),
  blockDates: (hoardingId, data) => api.patch(`/availability/${hoardingId}/block`, data),
  setWindow: (hoardingId, data) => api.patch(`/availability/${hoardingId}/window`, data),
};

// ────────────────────────────────────────
// INVOICES
// ────────────────────────────────────────
export const invoiceService = {
  generate: (bookingId) => api.get(`/invoices/booking/${bookingId}`),
};

// ────────────────────────────────────────
// DISPUTES
// ────────────────────────────────────────
export const disputeService = {
  raise: (bookingId, data) => api.post(`/disputes/${bookingId}/raise`, data),
  resolve: (bookingId, data) => api.patch(`/disputes/${bookingId}/resolve`, data),
  adminGetAll: () => api.get("/disputes/admin/all"),
};

// ────────────────────────────────────────
// REPORTS (Admin)
// ────────────────────────────────────────
export const reportService = {
  summary: (params) => api.get("/reports/summary", { params }),
  exportBookings: (params) => api.get("/reports/bookings", { params, responseType: "blob" }),
  exportPayments: (params) => api.get("/reports/payments", { params, responseType: "blob" }),
  exportUsers: (params) => api.get("/reports/users", { params, responseType: "blob" }),
  exportHoardings: (params) => api.get("/reports/hoardings", { params, responseType: "blob" }),
};

// ────────────────────────────────────────
// ADMIN
// ────────────────────────────────────────
export const adminService = {
  getUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
};

// ────────────────────────────────────────
// OTP
// ────────────────────────────────────────
export const otpService = {
  forgotPassword: (email) => api.post("/otp/forgot-password", { email }),
  resetPassword: (data) => api.post("/otp/reset-password", data),
  sendMobileOtp: (mobile) => api.post("/otp/send-mobile-otp", { mobile }),
  verifyMobileOtp: (data) => api.post("/otp/verify-mobile", data),
};