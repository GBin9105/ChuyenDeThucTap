"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import { api } from "@/lib/api";

/* =========================
 * Helpers
 * ========================= */
function currencyVND(v: any) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return String(v ?? "0");
  return n.toLocaleString("vi-VN") + " ₫";
}

function apiErrorMessage(e: any, fallback = "Thao tác thất bại.") {
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback;
  return String(msg);
}

function safeParseJSON<T = any>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function normalizeOrderFromResponse(resData: any) {
  // API thường có thể trả:
  // {status:true, data: order}
  // hoặc {data: {data: order}} (nếu wrap)
  // hoặc order trực tiếp
  return resData?.data?.data || resData?.data || resData;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const orderId = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const items = useMemo(() => {
    const raw = order?.items ?? order?.order_details ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [order]);

  const totals = useMemo(() => {
    // map theo Order model của bạn: subtotal, extras_total, total_price
    const subtotal = order?.subtotal ?? 0;
    const extras = order?.extras_total ?? 0;
    const total = order?.total_price ?? order?.total ?? 0;
    const countLines = items.length;
    const countItems = items.reduce((s: number, x: any) => s + Number(x?.qty ?? 0), 0);
    return { subtotal, extras, total, countLines, countItems };
  }, [order, items]);

  // =========================
  // Load order
  // =========================
  const fetchOrder = async () => {
    if (!orderId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn chưa đăng nhập.");
        setOrder(null);
        return;
      }

      const res = await api.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const o = normalizeOrderFromResponse(res?.data);
      if (!o || !o?.id) {
        setError("Không tìm thấy đơn hàng.");
        setOrder(null);
        return;
      }

      setOrder(o);
    } catch (e: any) {
      setError(apiErrorMessage(e, "Không tải được đơn hàng."));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // =========================
  // UI helpers
  // =========================
  const statusLabel = (s: any) => {
    const n = Number(s);
    if (n === 1) return "PENDING";
    if (n === 2) return "PAID";
    if (n === 3) return "CANCELED";
    return String(s ?? "");
  };

  const paymentLabel = (m: any) => {
    const v = String(m ?? "");
    if (v === "cod") return "COD";
    if (v === "vnpay") return "VNPay";
    return v;
  };

  const paymentStatusLabel = (s: any) => {
    const v = String(s ?? "");
    if (v === "pending") return "PENDING";
    if (v === "success") return "SUCCESS";
    if (v === "failed") return "FAILED";
    return v;
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-50">
        {/* Header giống Checkout */}
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
              <Link href="/orders" className="hover:text-slate-700">
                Orders
              </Link>{" "}
              <span className="mx-2">/</span>
              <span className="text-slate-700">#{orderId}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Chi tiết đơn hàng 
                </h1>
                <p className="mt-2 max-w-3xl text-slate-600">
                  Xem thông tin người nhận, trạng thái, tổng tiền và danh sách sản phẩm.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchOrder}
                  disabled={loading}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>

                <Link
                  href="/orders"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Danh sách Orders
                </Link>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-10">
          {/* Error state */}
          {error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">Không tải được đơn hàng</div>
              <div className="mt-2 text-sm text-slate-600">{error}</div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={fetchOrder}
                  className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Thử lại
                </button>
                <Link
                  href="/orders"
                  className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Về Orders
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </Link>
              </div>
            </div>
          ) : !order && loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">Đang tải...</div>
              <div className="mt-2 text-sm text-slate-600">Vui lòng chờ.</div>
            </div>
          ) : !order ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">Không tìm thấy đơn hàng</div>
              <div className="mt-2 text-sm text-slate-600">
                Đơn hàng có thể không thuộc user đang đăng nhập hoặc ID không đúng.
              </div>
              <Link
                href="/orders"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Về Orders
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left */}
              <div className="space-y-6 lg:col-span-8">
                {/* Receiver */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Thông tin nhận hàng</h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-slate-700">Họ và tên</div>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                        {order?.name ?? "-"}
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-slate-700">Số điện thoại</div>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                        {order?.phone ?? "-"}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-slate-700">Email</div>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                        {order?.email ?? "-"}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-slate-700">Địa chỉ</div>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                        {order?.address ?? "-"}
                      </div>
                    </div>

                    {order?.note ? (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-slate-700">Ghi chú</div>
                        <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                          {order?.note}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>

                {/* Items */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Sản phẩm</h2>

                  {items.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-600">Không có items trong đơn.</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {items.map((it: any) => (
                        <div
                          key={it?.id ?? `${it?.order_id}-${it?.product_id}-${it?.line_key}`}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900">
                                {it?.product_name ?? it?.product?.name ?? `Product#${it?.product_id}`}
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Qty: <b className="text-slate-900">{Number(it?.qty ?? 1)}</b>
                                {it?.size_name ? (
                                  <>
                                    {" "}
                                    • Size: <b className="text-slate-900">{it.size_name}</b>
                                  </>
                                ) : null}
                              </div>

                              {/* Snapshot cấu hình */}
                              {(it?.options || it?.toppings || it?.attribute_values) ? (
                                <div className="mt-2 space-y-1 text-xs text-slate-500">
                                  {it?.options ? (
                                    <div>
                                      Options:{" "}
                                      <span className="break-words">
                                        {typeof it.options === "string"
                                          ? it.options
                                          : JSON.stringify(it.options)}
                                      </span>
                                    </div>
                                  ) : null}
                                  {it?.toppings ? (
                                    <div>
                                      Toppings:{" "}
                                      <span className="break-words">
                                        {typeof it.toppings === "string"
                                          ? it.toppings
                                          : JSON.stringify(it.toppings)}
                                      </span>
                                    </div>
                                  ) : null}
                                  {it?.attribute_values ? (
                                    <div>
                                      Attribute values:{" "}
                                      <span className="break-words">
                                        {typeof it.attribute_values === "string"
                                          ? it.attribute_values
                                          : JSON.stringify(it.attribute_values)}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-slate-600">Line total</div>
                              <div className="text-base font-semibold text-slate-900">
                                {currencyVND(it?.line_total)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            <div>
                              Unit: <b className="text-slate-900">{currencyVND(it?.unit_price)}</b>
                            </div>
                            <div>
                              Extras: <b className="text-slate-900">{currencyVND(it?.extras_total)}</b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-4">
                  {/* Summary */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Tóm tắt
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Order code</span>
                        <b className="text-slate-900">{order?.order_code ?? "-"}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Payment</span>
                        <b className="text-slate-900">{paymentLabel(order?.payment_method)}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Payment status</span>
                        <b className="text-slate-900">{paymentStatusLabel(order?.payment_status)}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <b className="text-slate-900">{statusLabel(order?.status)}</b>
                      </div>

                      <div className="my-3 border-t border-slate-100" />

                      <div className="flex items-center justify-between">
                        <span>Lines</span>
                        <b className="text-slate-900">{totals.countLines}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Items</span>
                        <b className="text-slate-900">{totals.countItems}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <b className="text-slate-900">{currencyVND(totals.subtotal)}</b>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Extras</span>
                        <b className="text-slate-900">{currencyVND(totals.extras)}</b>
                      </div>

                      <div className="my-3 border-t border-slate-100" />

                      <div className="flex items-center justify-between text-base">
                        <span className="font-semibold text-slate-900">Grand total</span>
                        <span className="font-semibold text-slate-900">
                          {currencyVND(totals.total)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/profile"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Profile
                      </Link>

                      <Link
                        href="/products"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Tiếp tục mua
                      </Link>
                    </div>
                  </div>

                </div>
              </aside>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
