import { api } from "@/lib/api";

/**
 * SERVICE QUẢN LÝ SALE CỦA PRODUCT
 * --------------------------------
 * Bao gồm:
 * - Lấy sale của sản phẩm
 * - Lưu (tạo hoặc cập nhật) sale
 * - Xóa sale
 */
class ProductSaleService {

  /**
   * Lấy thông tin sale hiện tại của 1 sản phẩm
   * GET /admin/products/{productId}/sale
   */
  async getSale(productId: number) {
    const res = await api.get(`/admin/products/${productId}/sale`);
    return res?.data?.data ?? null;
  }

  /**
   * Tạo hoặc cập nhật sale cho sản phẩm
   * POST /admin/products/{productId}/sale
   */
  async saveSale(productId: number, payload: any) {
    const res = await api.post(`/admin/products/${productId}/sale`, payload);
    return res?.data?.data ?? null;
  }

  /**
   * Xóa sale của sản phẩm
   * DELETE /admin/products/{productId}/sale
   */
  async deleteSale(productId: number) {
    const res = await api.delete(`/admin/products/${productId}/sale`);
    return res?.data ?? { status: false };
  }
}

export const productSaleService = new ProductSaleService();
