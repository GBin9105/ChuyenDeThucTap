import { api } from "@/lib/api";
import type { ApiResponse, OrderDetail } from "./order.service";

export const orderDetailService = {
  /**
   * GET /api/orders/{id}/items
   * (auth:sanctum)
   */
  async getItemsByOrder(orderId: number) {
    const { data } = await api.get<ApiResponse<OrderDetail[]>>(
      `/orders/${orderId}/items`
    );
    return data;
  },
};
