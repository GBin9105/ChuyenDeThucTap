import { api } from "@/lib/api";

export class CategoryService {
  async all() {
    return await api.get("/admin/categories");
  }

  async get(id: number) {
    return await api.get(`/admin/categories/${id}`);
  }

  async create(data: any) {
    return await api.post("/admin/categories", data);
  }

  async update(id: number, data: any) {
    return await api.put(`/admin/categories/${id}`, data);
  }

  async delete(id: number) {
    return await api.delete(`/admin/categories/${id}`);
  }
}

export const categoryService = new CategoryService();
