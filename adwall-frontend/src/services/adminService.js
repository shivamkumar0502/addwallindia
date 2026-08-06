import api from "./api";
export const adminService = {
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
};
