import { api } from "@/lib/api";

export const bannerService = {
  all() {
    return api.get("/admin/banners");
  },

  show(id: number) {
    return api.get(`/admin/banners/${id}`);
  },

  create(data: any) {
    return api.post("/admin/banners", data);
  },

  update(id: number, data: any) {
    return api.put(`/admin/banners/${id}`, data);
  },

  delete(id: number) {
    return api.delete(`/admin/banners/${id}`);
  },
};
