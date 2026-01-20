import { api } from "@/lib/api";

/**
 * Đồng bộ 100% với BE
 */
export type DiscountType =
  | "percent"
  | "fixed_amount"
  | "fixed_price";

class SaleCampaignService {
  /**
   * ===============================
   * GET ALL CAMPAIGNS (ADMIN)
   * ===============================
   */
  async all() {
    const res = await api.get("/admin/sale-campaigns");

    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;

    return [];
  }

  /**
   * ===============================
   * GET ONE CAMPAIGN
   * ===============================
   */
  async get(id: number) {
    const res = await api.get(`/admin/sale-campaigns/${id}`);
    return res?.data?.data ?? null;
  }

  /**
   * ===============================
   * CREATE CAMPAIGN
   * ===============================
   */
  async create(payload: {
    name: string;
    description?: string | null;
    from_date: string;
    to_date: string;
  }) {
    const res = await api.post("/admin/sale-campaigns", payload);
    return res?.data?.data ?? null;
  }

  /**
   * ===============================
   * UPDATE CAMPAIGN
   * ===============================
   */
  async update(
    id: number,
    payload: {
      name: string;
      description?: string | null;
      from_date: string;
      to_date: string;
    }
  ) {
    const res = await api.put(
      `/admin/sale-campaigns/${id}`,
      payload
    );
    return res?.data?.data ?? null;
  }

  /**
   * ===============================
   * DELETE CAMPAIGN
   * ===============================
   */
  async delete(id: number) {
    const res = await api.delete(
      `/admin/sale-campaigns/${id}`
    );
    return res?.data ?? { status: false };
  }

  /**
   * ===============================
   * ATTACH PRODUCTS + SALE RULE
   *
   * percent       → giảm %
   * fixed_amount  → trừ tiền
   * fixed_price   → đồng giá
   * ===============================
   */
  async attachProducts(payload: {
    campaignId: number;
    type: DiscountType;
    percent?: number | null;
    sale_price?: number | null;
    productIds: number[];
  }) {
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

export const saleCampaignService =
  new SaleCampaignService();
