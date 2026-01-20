import { api } from "@/lib/api";

/**
 * =====================================================
 * KIỂU GIẢM GIÁ – ĐỒNG BỘ 100% VỚI BE
 *
 * percent       : giảm theo %
 * fixed_amount  : GIẢM TIỀN CỐ ĐỊNH (trừ tiền)
 * fixed_price   : ĐỒNG GIÁ
 * =====================================================
 */
export type DiscountType =
  | "percent"
  | "fixed_amount"
  | "fixed_price";

/**
 * =====================================================
 * PAYLOAD GÁN SẢN PHẨM CHO CAMPAIGN
 * 🔥 BE là nơi duy nhất quyết định logic giá
 * =====================================================
 */
export interface AttachProductsPayload {
  campaignId: number;
  type: DiscountType;

  // dùng khi type === "percent"
  percent?: number | null;

  // dùng khi type === "fixed_amount" | "fixed_price"
  sale_price?: number | null;

  productIds: number[];
}

class SaleCampaignItemService {
  /**
   * =====================================
   * LẤY DANH SÁCH ITEM TRONG CAMPAIGN
   * GET /admin/sale-campaigns/{id}
   * =====================================
   */
  async listByCampaign(campaignId: number) {
    const res = await api.get(
      `/admin/sale-campaigns/${campaignId}`
    );

    return res?.data?.data?.items ?? [];
  }

  /**
   * =====================================
   * GÁN / REPLACE SẢN PHẨM + SALE RULE
   * POST /admin/sale-campaigns/{id}/items
   *
   * FE chỉ gửi dữ liệu
   * BE quyết định toàn bộ logic giá
   * =====================================
   */
  async attachProducts(payload: AttachProductsPayload) {
    const {
      campaignId,
      type,
      percent,
      sale_price,
      productIds,
    } = payload;

    const res = await api.post(
      `/admin/sale-campaigns/${campaignId}/items`,
      {
        type,
        percent: type === "percent" ? percent : null,
        sale_price:
          type !== "percent" ? sale_price : null,
        products: productIds.map((id) => ({ id })),
      }
    );

    return res?.data ?? null;
  }
}

/**
 * =====================================================
 * EXPORT SINGLETON
 * =====================================================
 */
export const saleCampaignItemService =
  new SaleCampaignItemService();
