
import { api } from "@/lib/api";

export const userService = {
  getAll: (params?: any) => api.get("/admin/users", { params }),
  getById: (id: number) => api.get(`/admin/users/${id}`),
  create: (data: any) => api.post("/admin/users", data),
  update: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
};
