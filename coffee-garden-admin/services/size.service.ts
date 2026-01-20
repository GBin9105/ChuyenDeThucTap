import { api } from "@/lib/api";

class SizeService {
  async all() {
    return await api.get("/sizes");
  }

  async getProductSizes(productId: number) {
    return await api.get(`/products/${productId}/sizes`);
  }
}

export const sizeService = new SizeService();
