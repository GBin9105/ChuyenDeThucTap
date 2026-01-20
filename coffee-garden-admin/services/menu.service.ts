import { api } from "@/lib/api";

export const menuService = {
  all() {
    return api.get("/admin/menus");
  },

  show(id: number) {
    return api.get(`/admin/menus/${id}`);
  },

  create(data: any) {
    return api.post("/admin/menus", data);
  },

  update(id: number, data: any) {
    return api.put(`/admin/menus/${id}`, data);
  },

  delete(id: number) {
    return api.delete(`/admin/menus/${id}`);
  },
};
