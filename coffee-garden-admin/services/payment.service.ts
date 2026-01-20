import { api } from "@/lib/api";

/**
 * BE hiện tại của bạn:
 * - POST /api/payment/vnpay (auth:sanctum)
 *   body: { name, phone, email?, address?, note? }
 *   response: { status, payment_url, vnp_TxnRef, vnp_Amount }
 *
 * - GET /api/payment/vnpay/return (PUBLIC) -> BE redirect về FE (FRONTEND_RETURN_URL)
 */

export type PaymentStatus = "pending" | "success" | "failed";

export type VNPayCreatePayload = {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;
};

export type VNPayCreateResponse = {
  status: boolean;
  message?: string;

  payment_url?: string;

  vnp_TxnRef?: string;
  vnp_Amount?: number;
};

export type PaymentTransaction = {
  id: number;
  user_id?: number | null;
  order_id: number | null;

  vnp_TxnRef: string;
  vnp_Amount: number;

  vnp_TransactionNo?: string | null;
  vnp_ResponseCode?: string | null;
  vnp_TransactionStatus?: string | null;
  vnp_BankCode?: string | null;
  vnp_PayDate?: string | null;

  status: PaymentStatus;

  is_verified?: boolean;

  created_at?: string;
  updated_at?: string;
};

/**
 * Helper: lấy url redirect từ response BE (tolerant nhiều format)
 */
export function extractVNPayUrl(res: any): string | null {
  if (!res) return null;

  if (typeof res.payment_url === "string") return res.payment_url;
  if (typeof res.url === "string") return res.url;
  if (typeof res.redirect_url === "string") return res.redirect_url;

  if (res.data) {
    if (typeof res.data.payment_url === "string") return res.data.payment_url;
    if (typeof res.data.url === "string") return res.data.url;
    if (typeof res.data.redirect_url === "string") return res.data.redirect_url;
    if (typeof res.data.paymentUrl === "string") return res.data.paymentUrl;
  }

  return null;
}

export const paymentService = {
  /**
   * POST /payment/vnpay
   * Init VNPay payment cho TOÀN BỘ cart hiện tại (BE snapshot cart ở thời điểm gọi)
   */
  async createVNPayPayment(payload: VNPayCreatePayload): Promise<VNPayCreateResponse> {
    const { data } = await api.post<VNPayCreateResponse>("/payment/vnpay", payload);
    return data;
  },

  /**
   * Retry VNPay:
   * - Flow của BE là "pay cart", nên retry thực tế là gọi lại createVNPayPayment
   *   (BE tạo TxnRef mới + snapshot lại cart tại thời điểm retry)
   */
  async retryVNPay(payload: VNPayCreatePayload): Promise<VNPayCreateResponse> {
    return this.createVNPayPayment(payload);
  },

  /**
   * Helper action: create + redirect ngay
   */
  async createAndRedirect(payload: VNPayCreatePayload): Promise<void> {
    const res = await this.createVNPayPayment(payload);
    const url = extractVNPayUrl(res);

    if (!url) {
      throw new Error(res?.message || "Không lấy được URL VNPay từ server");
    }

window.location.href = String(url).trim();
  },

  /**
   * ADMIN only (theo routes bạn gửi):
   * GET /api/admin/orders/{orderId}/payments
   */
  async adminGetPaymentsByOrder(orderId: number): Promise<{ status: boolean; data: PaymentTransaction[] }> {
    const { data } = await api.get(`/admin/orders/${orderId}/payments`);
    return data;
  },

  /**
   * ADMIN only:
   * GET /api/admin/payments/{id}
   */
  async adminGetPayment(id: number): Promise<{ status: boolean; data: any }> {
    const { data } = await api.get(`/admin/payments/${id}`);
    return data;
  },
};
