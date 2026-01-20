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
 */
export type VNPayInitResponse = {
  status: boolean;
  message?: string;
  payment_url: string;
  vnp_TxnRef: string;
  vnp_Amount: number;
};

/**
 * Order / OrderDetail theo schema bạn đang dùng
 */
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
 * FE payload:
 * - COD: POST /orders (BE tự lấy cart, KHÔNG nhận items)
 * - VNPay: POST /payment/vnpay (BE snapshot cart + trả payment_url)
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
    return data;
  },

  /**
   * GET /api/orders/{id}
   */
  async getMyOrder(id: number) {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return data;
  },

  /**
   * GET /api/orders/{id}/items
   * (route đang có trong api.php)
   */
  async getMyOrderItems(orderId: number) {
    const { data } = await api.get<ApiResponse<OrderDetail[]>>(
      `/orders/${orderId}/items`
    );
    return data;
  },

  /**
   * COD checkout:
   * POST /api/orders
   * - BE sẽ đọc cart của user hiện tại, tự tính totals, tạo order + order_details, rồi clear cart
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
    return data;
  },

  /**
   * VNPay init:
   * POST /api/payment/vnpay
   * - BE snapshot cart, tạo payment_transactions pending, trả payment_url để FE redirect
   */
  async createVNPayPayment(payload: CreateVNPayPayload) {
    const body = {
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      address: payload.address ?? null,
      note: payload.note ?? null,
    };

    const { data } = await api.post<VNPayInitResponse>("/payment/vnpay", body);
    return data;
  },
};
