"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "@/lib/api";

import OrderDetailModal from "./OrderDetailModal";

type PaymentMethod = "vnpay" | "cod" | string;
type PaymentStatus = "pending" | "success" | "failed" | string;

type ClientOrder = {
  id: number;
  order_code?: string | null;

  // checkout snapshot
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  // 1 pending | 2 paid | 3 canceled
  status: number | string;

  total_price: string | number;

  created_at?: string;
};

type ApiResponse<T> = { status: boolean; message?: string; data: T };

function toNumber(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function currencyVND(v: any) {
  return toNumber(v).toLocaleString("vi-VN") + " ₫";
}

function formatStatus(status: number | string): { label: string; cls: string } {
  const sNum = typeof status === "number" ? status : Number(status);

  if (Number.isFinite(sNum)) {
    if (sNum === 1)
      return {
        label: "pending",
        cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    if (sNum === 2)
      return {
        label: "paid",
        cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    if (sNum === 3)
      return {
        label: "canceled",
        cls: "bg-rose-100 text-rose-700 border-rose-200",
      };
  }

  const s = String(status || "unknown");
  return { label: s, cls: "bg-slate-100 text-slate-700 border-slate-200" };
}

function apiErrorMessage(e: any, fallback = "Thao tác thất bại.") {
  const errors = e?.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const keys = Object.keys(errors);
    if (keys.length) {
      const first = (errors as any)[keys[0]];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === "string") return first;
    }
  }
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
}

function NoScrollbarStyle() {
  return (
    <style jsx global>{`
      .no-scrollbar::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  );
}

function normalizeOrderList(payload: any): ClientOrder[] {
  // supports:
  // 1) {status:true, data: [...]}
  // 2) {status:true, data: {data:[...], ...paginate}}
  // 3) direct [...]
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function isPendingStatus(status: number | string) {
  return String(status) === "1";
}

function isCod(order: ClientOrder) {
  return String(order.payment_method) === "cod";
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(""); // "", "1","2","3"
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // "", "vnpay","cod"
  const [paymentStatus, setPaymentStatus] = useState<string>(""); // "", "pending","success","failed"

  // per-order action loading
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<ApiResponse<any>>("/orders");
      const list = normalizeOrderList(res.data?.data ?? res.data);
      setOrders(list);
    } catch (e: any) {
      setOrders([]);
      setError(apiErrorMessage(e, "Không tải được danh sách đơn hàng."));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const kw = q.trim().toLowerCase();

    return (orders ?? []).filter((o) => {
      const matchQ =
        !kw ||
        String(o.order_code ?? "").toLowerCase().includes(kw) ||
        String(o.name ?? "").toLowerCase().includes(kw) ||
        String(o.phone ?? "").toLowerCase().includes(kw) ||
        String(o.email ?? "").toLowerCase().includes(kw);

      const matchStatus = !status || String(o.status) === String(status);
      const matchPM =
        !paymentMethod || String(o.payment_method) === String(paymentMethod);
      const matchPS =
        !paymentStatus || String(o.payment_status) === String(paymentStatus);

      return matchQ && matchStatus && matchPM && matchPS;
    });
  }, [orders, q, status, paymentMethod, paymentStatus]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const pending = filteredOrders.filter((x) => String(x.status) === "1").length;
    const paid = filteredOrders.filter((x) => String(x.status) === "2").length;
    const canceled = filteredOrders.filter((x) => String(x.status) === "3").length;
    const totalSpend = filteredOrders.reduce(
      (s, x) => s + toNumber(x.total_price),
      0
    );

    return { totalOrders, pending, paid, canceled, totalSpend };
  }, [filteredOrders]);

  const setRowLoading = (id: number, v: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: v }));
  };

  /**
   * COD: user confirms received
   * PATCH /api/orders/{id}/received
   */
  const handleReceived = async (order: ClientOrder) => {
    setError("");
    if (!isCod(order) || !isPendingStatus(order.status)) return;

    const ok = window.confirm(
      "Xác nhận bạn đã nhận được hàng? Thao tác này sẽ hoàn tất đơn và trừ kho."
    );
    if (!ok) return;

    try {
      setRowLoading(order.id, true);

      // Nếu BE bạn đặt route khác, sửa URL tại đây
      await api.patch(`/orders/${order.id}/received`);

      // Nếu đang mở modal đúng order -> đóng để tránh hiển thị dữ liệu cũ
      if (selectedId === order.id) setSelectedId(null);

      await loadOrders();
    } catch (e: any) {
      setError(apiErrorMessage(e, "Xác nhận nhận hàng thất bại."));
    } finally {
      setRowLoading(order.id, false);
    }
  };

  /**
   * COD: user cancels order
   * PATCH /api/orders/{id}/cancel
   */
  const handleCancel = async (order: ClientOrder) => {
    setError("");
    if (!isCod(order) || !isPendingStatus(order.status)) return;

    const ok = window.confirm(
      "Bạn chắc chắn muốn hủy đơn này? Thao tác này không thể hoàn tác."
    );
    if (!ok) return;

    // optional: hỏi lý do (nếu BE không cần, vẫn gửi null)
    const reason = window.prompt("Lý do hủy (không bắt buộc):") ?? null;

    try {
      setRowLoading(order.id, true);

      // Nếu BE bạn đặt route khác, sửa URL tại đây
      await api.patch(`/orders/${order.id}/cancel`, { reason });

      if (selectedId === order.id) setSelectedId(null);

      await loadOrders();
    } catch (e: any) {
      setError(apiErrorMessage(e, "Hủy đơn thất bại."));
    } finally {
      setRowLoading(order.id, false);
    }
  };

  return (
    <>
      <Navbar />
      <NoScrollbarStyle />

      <div className="min-h-screen bg-slate-50">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[55rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-sky-200/40 to-emerald-200/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-10">
            <div className="text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-700">
                Home
              </Link>{" "}
              <span className="mx-2">/</span>
              <Link href="/profile" className="hover:text-slate-700">
                Profile
              </Link>{" "}
              <span className="mx-2">/</span>
              <span className="text-slate-700">Orders</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Đơn hàng của bạn
            </h1>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={loadOrders}
                disabled={loading}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <Link
                href="/products"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tiếp tục mua
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-10">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT */}
            <div className="space-y-6 lg:col-span-8">
              {/* FILTERS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Bộ lọc
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm theo code / tên / phone / email..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
                  />

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Pending</option>
                    <option value="2">Paid</option>
                    <option value="3">Canceled</option>
                  </select>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Tất cả payment method</option>
                    <option value="vnpay">VNPay</option>
                    <option value="cod">COD</option>
                  </select>

                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Tất cả payment status</option>
                    <option value="pending">pending</option>
                    <option value="success">success</option>
                    <option value="failed">failed</option>
                  </select>
                </div>
              </section>

              {/* LIST */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Danh sách đơn hàng
                </h2>

                {loading ? (
                  <div className="mt-4 text-slate-600">Loading...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                    Không có đơn hàng phù hợp.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {filteredOrders.map((o) => {
                      const st = formatStatus(o.status);

                      const canCodAction =
                        isCod(o) && isPendingStatus(o.status);

                      const rowBusy = !!actionLoading[o.id];

                      return (
                        <div
                          key={o.id}
                          className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-base font-semibold text-slate-900">
                                  Order
                                </div>

                                <span
                                  className={[
                                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                                    st.cls,
                                  ].join(" ")}
                                >
                                  {st.label}
                                </span>

                                {String(o.payment_method) === "cod" && (
                                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                    COD
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Code:{" "}
                                <b className="text-slate-900">
                                  {o.order_code || "-"}
                                </b>
                              </div>

                              <div className="mt-2 text-sm text-slate-600">
                                Họ và tên:{" "}
                                <b className="text-slate-900">{o.name || "-"}</b>
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Phone:{" "}
                                <b className="text-slate-900">
                                  {o.phone || "-"}
                                </b>
                                {o.email ? (
                                  <>
                                    {" "}
                                    • Email:{" "}
                                    <b className="text-slate-900">{o.email}</b>
                                  </>
                                ) : null}
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Payment:{" "}
                                <b className="text-slate-900">
                                  {o.payment_method}
                                </b>{" "}
                                /{" "}
                                <b className="text-slate-900">
                                  {o.payment_status}
                                </b>
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                Created:{" "}
                                {o.created_at
                                  ? new Date(o.created_at).toLocaleString(
                                      "vi-VN"
                                    )
                                  : "-"}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-sm text-slate-600">Total</div>
                              <div className="text-base font-semibold text-slate-900">
                                {currencyVND(o.total_price)}
                              </div>

                              <button
                                onClick={() => setSelectedId(o.id)}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                              >
                                Xem chi tiết
                              </button>

                              {/* COD ACTIONS */}
                              {canCodAction && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleReceived(o)}
                                    disabled={rowBusy || loading}
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                                    title="Xác nhận đã nhận hàng (sẽ hoàn tất và trừ kho)"
                                  >
                                    {rowBusy ? "..." : "Đã nhận"}
                                  </button>

                                  <button
                                    onClick={() => handleCancel(o)}
                                    disabled={rowBusy || loading}
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                    title="Hủy đơn (chỉ khi pending)"
                                  >
                                    {rowBusy ? "..." : "Hủy đơn"}
                                  </button>
                                </div>
                              )}

                              {rowBusy && (
                                <div className="mt-2 text-xs text-slate-500">
                                  Đang xử lý…
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Tóm tắt
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Tổng đơn</span>
                      <b className="text-slate-900">{summary.totalOrders}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending</span>
                      <b className="text-slate-900">{summary.pending}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Paid</span>
                      <b className="text-slate-900">{summary.paid}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Canceled</span>
                      <b className="text-slate-900">{summary.canceled}</b>
                    </div>

                    <div className="my-3 border-t border-slate-100" />

                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold text-slate-900">
                        Tổng chi tiêu
                      </span>
                      <span className="font-semibold text-slate-900">
                        {currencyVND(summary.totalSpend)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    Ghi chú COD
                  </div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Với COD, đơn sẽ ở trạng thái <b>pending</b> cho đến khi bạn bấm{" "}
                    <b>Đã nhận</b>. Khi xác nhận nhận hàng, hệ thống sẽ hoàn tất đơn,
                    trừ kho và gửi email (nếu BE đã implement).
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {selectedId && (
        <OrderDetailModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      <Footer />
    </>
  );
}
