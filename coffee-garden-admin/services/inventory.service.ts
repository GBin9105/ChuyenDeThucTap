import { api } from "@/lib/api";

/* =========================================================
 * TYPES (PHƯƠNG ÁN B – SNAPSHOT + LOG)
 * ========================================================= */

/**
 * Inventory snapshot
 * API: GET /api/admin/inventory
 *
 * Backend hiện đang trả:
 * [
 *   {
 *     id,
 *     name,
 *     thumbnail,
 *     price_base,
 *     stock,
 *     cost_price,
 *     inventory: {...}
 *   }
 * ]
 */
export interface InventoryItem {
  id: number;               // product id
  name: string;
  thumbnail: string;
  price_base: number;

  stock: number;
  cost_price: number | string;

  inventory?: {
    id: number;
    product_id: number;
    stock: number;
    cost_price: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Inventory history
 * API: GET /api/admin/inventory/{productId}/history
 */
export interface InventoryHistoryItem {
  id: number;
  product_id: number;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  price_root: number | null;
  note: string | null;
  created_at: string;

  admin?: {
    id: number;
    name: string;
  };
}

/* =========================================================
 * SERVICE
 * ========================================================= */
export class InventoryService {
  /**
   * ==================================================
   * GET ALL INVENTORY (SNAPSHOT)
   * API: GET /api/admin/inventory
   * ==================================================
   */
  async all(): Promise<InventoryItem[]> {
    const res = await api.get("/admin/inventory");

    // chuẩn Laravel { data: [...] }
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }

    // fallback nếu BE trả mảng trực tiếp
    if (Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  }

  /**
   * ==================================================
   * GET INVENTORY BY PRODUCT
   * API: GET /api/admin/inventory/{productId}
   * ==================================================
   */
  async getByProduct(
    productId: number
  ): Promise<InventoryItem | null> {
    const res = await api.get(
      `/admin/inventory/${productId}`
    );

    if (res.data?.data) return res.data.data;
    if (res.data?.inventory) return res.data.inventory;

    return null;
  }

  /**
   * ==================================================
   * IMPORT INVENTORY (NHẬP KHO)
   * API: POST /api/admin/inventory/import
   * ==================================================
   */
  async import(payload: {
    product_id: number;
    qty: number;
    price_root: number;
  }) {
    const res = await api.post(
      "/admin/inventory/import",
      payload
    );

    return res.data;
  }

  /**
   * ==================================================
   * ADJUST INVENTORY (KIỂM KÊ / ĐIỀU CHỈNH)
   * API: POST /api/admin/inventory/adjust
   * ==================================================
   */
  async adjust(payload: {
    product_id: number;
    qty: number;
    price_root?: number;
  }) {
    const res = await api.post(
      "/admin/inventory/adjust",
      payload
    );

    return res.data;
  }

  /**
   * ==================================================
   * GET INVENTORY HISTORY
   * API: GET /api/admin/inventory/{productId}/history
   * ==================================================
   */
  async history(
    productId: number
  ): Promise<InventoryHistoryItem[]> {
    const res = await api.get(
      `/admin/inventory/${productId}/history`
    );

    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  }
}

/* =========================================================
 * EXPORT INSTANCE
 * ========================================================= */
export const inventoryService = new InventoryService();
