import { api } from "@/lib/api";

/* =========================
 * TYPES
 * ========================= */

export type MoneyString = string; // Laravel decimal cast thường trả string

export type CartLine = {
  id: number;
  user_id: number;
  product_id: number;

  // legacy (sizes) - có thể null (nhưng bạn đang dùng attribute size => thường null)
  size_id: number | null;

  // theo attribute (size group)
  size_name: string | null;
  size_price_extra: MoneyString;

  qty: number;

  // options dạng key/value
  options: Record<string, any> | null;

  // map từ group "topping"
  toppings: Array<{
    id: number;
    name: string;
    qty?: number;
    price_extra?: number | MoneyString;
  }> | null;

  // các group khác (đường/đá/...)
  attribute_values: Array<{
    group_id?: number | null;
    group_name?: string | null;
    value_id?: number | null;
    value_name?: string | null;
    qty?: number;
    price_extra?: number | MoneyString;
  }> | null;

  line_key: string;

  unit_price: MoneyString;    // product.final_price (sale) từ BE
  extras_total: MoneyString;  // size + toppings + attributes
  line_total: MoneyString;

  product?: any;
  user?: any;
  size?: any;

  created_at?: string;
  updated_at?: string;
};

export type CartTotals = {
  subtotal: number;
  extras_total: number;
  grand_total: number;
  count_lines?: number;
  count_items?: number;
};

export type CartIndexResponse = {
  status: boolean;
  lines: CartLine[];
  totals: CartTotals;
};

export type AddToCartPayload = {
  product_id: number;
  qty: number;

  options?: Record<string, any> | null;

  /**
   * Chuẩn bạn đang dùng:
   * IDs của Attribute VALUE (type=value) và phải thuộc product_attributes(active=1)
   */
  attribute_value_ids?: number[];

  /**
   * Legacy giữ lại nếu bạn còn thử nghiệm.
   * Khuyến nghị: FE client không dùng các field này nữa.
   */
  size_id?: number | null;
  toppings?: any[] | null;
  attribute_values?: any[] | null;
};

export type UpdateCartPayload = {
  qty?: number | null;
  options?: Record<string, any> | null;

  attribute_value_ids?: number[];

  // legacy
  size_id?: number | null;
  toppings?: any[] | null;
  attribute_values?: any[] | null;
};

export type CartMutateResponse = {
  status: boolean;
  message?: string;
  line?: CartLine;
  lines?: CartLine[];
  totals?: CartTotals;
};

export type ClearCartResponse = {
  status: boolean;
  message?: string;
  lines: CartLine[];
  totals: CartTotals;
};

/* =========================
 * ADMIN TYPES
 * ========================= */

export type AdminCartIndexResponse = {
  status: boolean;
  user?: any | null;
  data: CartLine[];
  totals: CartTotals;
};

export type AdminCartClearResponse = {
  status: boolean;
  message?: string;
  deleted?: number;
};

/* =========================
 * SERVICE
 * ========================= */

export const cartService = {
  /**
   * ======================
   * USER CART
   * ======================
   */
  async getCart(): Promise<CartIndexResponse> {
    const { data } = await api.get<CartIndexResponse>("/cart");
    return data;
  },

  async add(payload: AddToCartPayload): Promise<CartMutateResponse> {
    const { data } = await api.post<CartMutateResponse>("/cart", payload);
    return data;
  },

  async update(cartId: number, payload: UpdateCartPayload): Promise<CartMutateResponse> {
    const { data } = await api.patch<CartMutateResponse>(`/cart/${cartId}`, payload);
    return data;
  },

  async remove(cartId: number): Promise<CartMutateResponse> {
    const { data } = await api.delete<CartMutateResponse>(`/cart/${cartId}`);
    return data;
  },

  async clear(): Promise<ClearCartResponse> {
    const { data } = await api.delete<ClearCartResponse>("/cart");
    return data;
  },

  /**
   * ======================
   * ADMIN CART
   * ======================
   * API: /admin/carts
   *
   * Lưu ý theo yêu cầu của bạn:
   * - Admin không được "chỉnh qty cart vượt kho" trên FE client.
   * - Admin chỉ nên xem/xoá line, và clear theo user.
   */
  async getAdminCarts(params?: { user_id?: number }): Promise<AdminCartIndexResponse> {
    const { data } = await api.get<AdminCartIndexResponse>("/admin/carts", { params });
    return data;
  },

  async deleteAdminLine(id: number): Promise<{ status: boolean; message?: string }> {
    const { data } = await api.delete<{ status: boolean; message?: string }>(`/admin/carts/${id}`);
    return data;
  },

  /**
   * Clear cart theo user (BẮT BUỘC user_id)
   * DELETE /admin/carts/clear?user_id=123
   */
  async clearAdminByUser(userId: number): Promise<AdminCartClearResponse> {
    const { data } = await api.delete<AdminCartClearResponse>("/admin/carts/clear", {
      params: { user_id: userId },
    });
    return data;
  },
};
