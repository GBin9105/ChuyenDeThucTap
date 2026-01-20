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
  name: string; // họ tên nhập tại checkout
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
    if (sNum === 1) return { label: "pending", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    if (sNum === 2) return { label: "paid", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (sNum === 3) return { label: "canceled", cls: "bg-rose-100 text-rose-700 border-rose-200" };
  }

  const s = String(status || "unknown");
  return { label: s, cls: "bg-slate-100 text-slate-700 border-slate-200" };
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
  // hỗ trợ nhiều kiểu BE:
  // 1) {status:true, data: [...]}
  // 2) {status:true, data: {data:[...], ...paginate}}
  // 3) trả thẳng [...]
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>("/orders");
      const list = normalizeOrderList(res.data?.data ?? res.data);
      setOrders(list);
    } catch {
      setOrders([]);
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
      const matchPM = !paymentMethod || String(o.payment_method) === String(paymentMethod);
      const matchPS = !paymentStatus || String(o.payment_status) === String(paymentStatus);

      return matchQ && matchStatus && matchPM && matchPS;
    });
  }, [orders, q, status, paymentMethod, paymentStatus]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const pending = filteredOrders.filter((x) => String(x.status) === "1").length;
    const paid = filteredOrders.filter((x) => String(x.status) === "2").length;
    const canceled = filteredOrders.filter((x) => String(x.status) === "3").length;
    const totalSpend = filteredOrders.reduce((s, x) => s + toNumber(x.total_price), 0);

    return { totalOrders, pending, paid, canceled, totalSpend };
  }, [filteredOrders]);

  return (
    <>
      <Navbar />
      <NoScrollbarStyle />

      <div className="min-h-screen bg-slate-50">
        {/* HERO giống Checkout */}
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

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Đơn hàng của bạn</h1>

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
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT: danh sách giống kiểu card sản phẩm checkout */}
            <div className="space-y-6 lg:col-span-8">

              {/* LIST */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Danh sách đơn hàng</h2>

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
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Code:{" "}
                                <b className="text-slate-900">{o.order_code || "-"}</b>
                              </div>

                              <div className="mt-2 text-sm text-slate-600">
                                Họ và tên:{" "}
                                <b className="text-slate-900">{o.name || "-"}</b>
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Phone: <b className="text-slate-900">{o.phone || "-"}</b>
                                {o.email ? (
                                  <>
                                    {" "}
                                    • Email: <b className="text-slate-900">{o.email}</b>
                                  </>
                                ) : null}
                              </div>

                              <div className="mt-1 text-sm text-slate-600">
                                Payment:{" "}
                                <b className="text-slate-900">{o.payment_method}</b> /{" "}
                                <b className="text-slate-900">{o.payment_status}</b>
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                Created:{" "}
                                {o.created_at ? new Date(o.created_at).toLocaleString("vi-VN") : "-"}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-sm text-slate-600">Total</div>
                              <div className="text-base font-semibold text-slate-900">
                                {currencyVND(o.total_price)}
                              </div>

                              <button
                                onClick={() => setSelectedId(o.id)}
                                className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT: summary giống Checkout */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">Tóm tắt</div>

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
                      <span className="font-semibold text-slate-900">Tổng chi tiêu</span>
                      <span className="font-semibold text-slate-900">{currencyVND(summary.totalSpend)}</span>
                    </div>
                  </div>


                </div>

              </div>
            </aside>
          </div>
        </main>
      </div>

      {selectedId && <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} />}

      <Footer />
    </>
  );
}
