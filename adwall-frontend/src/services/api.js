import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // cookies (refresh token) ke liye
});

// Har request me access token automatically add karo
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 aane pe refresh token se naya access token lo
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem("accessToken", data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Service functions ---
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

export const aiService = {
  visibilityScore: (id) => api.get(`/ai/visibility-score/${id}`),
  priceRecommendation: (id) => api.get(`/ai/price-recommendation/${id}`),
  mediaPlan: (data) => api.post("/ai/media-planner", data),
  budgetPlan: (data) => api.post("/ai/budget-planner", data),
};

export const agreementService = {
  generate: (bookingId) => api.post(`/agreements/generate/${bookingId}`),
  getByBooking: (bookingId) => api.get(`/agreements/booking/${bookingId}`),
  sign: (id) => api.post(`/agreements/${id}/sign`),
};
