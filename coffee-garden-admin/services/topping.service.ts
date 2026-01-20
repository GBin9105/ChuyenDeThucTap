import { api } from "@/lib/api";

class ToppingService {
  async all() {
    return await api.get("/toppings");
  }

  async getProductToppings(productId: number) {
    return await api.get(`/products/${productId}/toppings`);
  }
}

export const toppingService = new ToppingService();
