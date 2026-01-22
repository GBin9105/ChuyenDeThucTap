import { api } from "@/lib/api";

/**
 * =========================================================
 * Types (match BE hiện tại)
 * =========================================================
 */

export type OrderPaymentMethod = "vnpay" | "cod";
export type OrderPaymentStatus = "pending" | "success" | "failed";

// BE: orders.status = tinyint (1 pending | 2 paid | 3 canceled)
export type OrderBusinessStatus = 1 | 2 | 3 | number;

export type ApiResponse<T> = {
  status: boolean;
  message?: string;
  data: T;
};

/**
 * VNPay init response (POST /api/payment/vnpay)
 * BE của bạn hiện tại trả dạng:
 * {
 *   code: "00",
 *   message: "success",
 *   payment_url: "...",
 *   vnp_TxnRef: "...",
 *   order_id: 123,
 *   order_code: "ORD-..."
 * }
 */
export type VNPayInitResponse = {
  code: string; // "00" success
  message?: string;
  payment_url: string;
  vnp_TxnRef: string;
  order_id?: number;
  order_code?: string;
};

export type OrderDetail = {
  id: number;
  order_id: number;

  product_id: number | null;

  // product snapshot
  product_name: string;
  product_slug?: string | null;
  product_thumbnail?: string | null;

  // legacy + snapshot
  size_id?: number | null;
  size_name?: string | null;
  size_price_extra?: string | number;

  // canonical ids
  attribute_value_ids?: number[] | null;

  qty: number;

  // config snapshot
  options?: any;
  toppings?: any;
  attribute_values?: any;

  line_key?: string | null;

  // pricing snapshot
  unit_price: string | number;
  extras_total: string | number;
  line_total: string | number;

  product?: any;
  size?: any;

  created_at?: string;
  updated_at?: string;
};

export type Order = {
  id: number;
  user_id: number | null;

  order_code: string;

  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;

  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;

  status: OrderBusinessStatus;

  subtotal?: string | number;
  extras_total?: string | number;
  total_price: string | number;

  paid_at?: string | null;
  note?: string | null;

  vnp_TxnRef?: string | null;

  items?: OrderDetail[];

  created_at?: string;
  updated_at?: string;
};

/**
 * Response của GET /api/orders/{id}/items theo code BE bạn gửi:
 * {
 *   status: true,
 *   data: {
 *     order: { ... },
 *     items: [ ... ]
 *   }
 * }
 */
export type OrderItemsResponse = {
  order: Order;
  items: OrderDetail[];
};

/**
 * FE payload:
 * - COD: POST /orders
 * - VNPay: POST /payment/vnpay
 */
export type CheckoutReceiverPayload = {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;
};

export type CreateCodOrderPayload = CheckoutReceiverPayload & {
  payment_method: "cod";
};

export type CreateVNPayPayload = CheckoutReceiverPayload;

/**
 * COD actions payload (tuỳ bạn có dùng hay không)
 * Nếu BE không nhận body, bạn cứ gọi không payload vẫn OK.
 */
export type CancelOrderPayload = {
  reason?: string | null;
  note?: string | null;
};

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
function assertApiOk<T>(resp: ApiResponse<T>): ApiResponse<T> {
  if (!resp?.status) {
    const msg = resp?.message || "Request failed";
    throw new Error(msg);
  }
  return resp;
}

function normalizeVNPayResponse(raw: any): VNPayInitResponse {
  // Nếu BE trả đúng như code bạn gửi: { code: "00", payment_url, vnp_TxnRef, ... }
  if (raw && typeof raw === "object" && typeof raw.code === "string") {
    return raw as VNPayInitResponse;
  }

  // Fallback (phòng khi bạn từng dùng format {status:boolean,...})
  // Cố gắng map các field tương đương nếu có
  const payment_url = raw?.payment_url ?? raw?.data?.payment_url;
  const vnp_TxnRef = raw?.vnp_TxnRef ?? raw?.data?.vnp_TxnRef;

  if (!payment_url || !vnp_TxnRef) {
    throw new Error(raw?.message || "VNPay response invalid");
  }

  return {
    code: raw?.code ?? (raw?.status ? "00" : "99"),
    message: raw?.message,
    payment_url,
    vnp_TxnRef,
    order_id: raw?.order_id ?? raw?.data?.order_id,
    order_code: raw?.order_code ?? raw?.data?.order_code,
  };
}

/**
 * =========================================================
 * Service
 * =========================================================
 */
export const orderService = {
  /**
   * GET /api/orders
   */
  async getMyOrders() {
    const { data } = await api.get<ApiResponse<Order[]>>("/orders");
    return assertApiOk(data).data;
  },

  /**
   * GET /api/orders/{id}
   */
  async getMyOrder(id: number) {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return assertApiOk(data).data;
  },

  /**
   * GET /api/orders/{id}/items
   * BE trả data: { order, items }
   */
  async getMyOrderItems(orderId: number) {
    const { data } = await api.get<ApiResponse<OrderItemsResponse>>(
      `/orders/${orderId}/items`
    );
    return assertApiOk(data).data; // {order, items}
  },

  /**
   * COD checkout:
   * POST /api/orders
   */
  async createCodOrder(payload: CreateCodOrderPayload) {
    const body = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      address: payload.address ?? null,
      note: payload.note ?? null,
      payment_method: "cod" as const,
    };

    const { data } = await api.post<ApiResponse<Order>>("/orders", body);
    return assertApiOk(data).data;
  },

  /**
   * VNPay init:
   * POST /api/payment/vnpay
   */
  async createVNPayPayment(payload: CreateVNPayPayload) {
    const body = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      address: payload.address ?? null,
      note: payload.note ?? null,
    };

    const res = await api.post("/payment/vnpay", body);
    return normalizeVNPayResponse(res.data);
  },

  /**
   * COD: Client bấm "Đã nhận"
   * PATCH /api/orders/{id}/received
   */
  async markReceived(orderId: number) {
    const { data } = await api.patch<ApiResponse<Order>>(
      `/orders/${orderId}/received`
    );
    return assertApiOk(data).data;
  },

  /**
   * COD: Client bấm "Hủy đơn"
   * PATCH /api/orders/{id}/cancel
   */
  async cancel(orderId: number, payload?: CancelOrderPayload) {
    const body = {
      reason: payload?.reason ?? null,
      note: payload?.note ?? null,
    };

    const { data } = await api.patch<ApiResponse<Order>>(
      `/orders/${orderId}/cancel`,
      body
    );
    return assertApiOk(data).data;
  },
};
