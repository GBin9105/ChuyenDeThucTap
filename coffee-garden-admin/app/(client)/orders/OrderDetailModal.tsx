"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

type PaymentMethod = "vnpay" | "cod" | string;
type PaymentStatus = "pending" | "success" | "failed" | string;

type OrderItem = {
  id: number;
  product_name: string;
  product_thumbnail?: string | null;

  size_name?: string | null;
  size_price_extra?: string | number;

  qty: number;

  unit_price: string | number;
  extras_total: string | number;
  line_total: string | number;

  toppings?: any;
  attribute_values?: any;
};

type OrderDetail = {
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

  status: number | string;

  subtotal?: string | number;
  extras_total?: string | number;
  total_price: string | number;

  paid_at?: string | null;
  created_at?: string;

  items?: OrderItem[];
};

type ApiResponse<T> = { status: boolean; message?: string; data: T };

function toNumber(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function currencyVND(v: any) {
  return toNumber(v).toLocaleString("vi-VN") + " ₫";
}

function statusLabel(status: number | string): { label: string; cls: string } {
  const sNum = typeof status === "number" ? status : Number(status);

  if (Number.isFinite(sNum)) {
    if (sNum === 1) return { label: "pending", cls: "bg-yellow-500 shadow-[0_0_10px_rgba(255,200,0,0.35)]" };
    if (sNum === 2) return { label: "paid", cls: "bg-emerald-600 shadow-[0_0_10px_rgba(0,255,150,0.35)]" };
    if (sNum === 3) return { label: "canceled", cls: "bg-rose-600 shadow-[0_0_10px_rgba(255,80,80,0.45)]" };
  }

  return { label: String(status || "unknown"), cls: "bg-slate-600 shadow-[0_0_10px_rgba(120,120,120,0.25)]" };
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

export default function OrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<ApiResponse<OrderDetail>>(`/orders/${orderId}`);
        if (!mounted) return;

        if (res.data?.status === false) {
          setOrder(null);
          setError(res.data?.message || "Cannot load order.");
        } else {
          setOrder(res.data?.data ?? null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setOrder(null);
        setError(e?.response?.data?.message || "Cannot load order (network/server error).");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const items = order?.items ?? [];

  const computed = useMemo(() => {
    const sumLine = items.reduce((acc, it) => acc + toNumber(it.line_total), 0);
    return {
      subtotal: order?.subtotal ?? null,
      extras_total: order?.extras_total ?? null,
      total_price: order?.total_price ?? sumLine,
      sumLine,
    };
  }, [items, order]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <NoScrollbarStyle />

      <div
        className="
          w-[820px] max-w-[95vw]
          max-h-[85vh] overflow-y-auto no-scrollbar
          p-8 rounded-2xl
          bg-white
          border border-slate-200
          shadow-xl
          relative
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-rose-500 hover:bg-rose-600 transition p-1.5 rounded-full"
          aria-label="Close"
          type="button"
        >
          <X size={20} />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Order</h2>
            <div className="text-sm text-slate-600 mt-1">
              {order?.order_code ? (
                <span>
                  Code: <b className="text-slate-900">{order.order_code}</b>
                </span>
              ) : (
                <span className="italic">No order_code</span>
              )}
            </div>
          </div>

          {!loading && order && (
            <div className="text-right text-sm text-slate-600">
              <div>
                Payment: <b className="text-slate-900">{order.payment_method}</b> /{" "}
                <b className="text-slate-900">{order.payment_status}</b>
              </div>
              <div>
                Paid at:{" "}
                <b className="text-slate-900">
                  {order.paid_at ? new Date(order.paid_at).toLocaleString("vi-VN") : "-"}
                </b>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="mt-6 text-slate-700">Loading...</div>}

        {!loading && error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
            {error}
          </div>
        )}

        {!loading && order && (
          <>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-900">
              <div className="space-y-2">
                <p>
                  <strong>Họ và tên:</strong>{" "}
                  <span className="font-semibold">{order.name || "-"}</span>
                </p>
                <p>
                  <strong>Phone:</strong> {order.phone || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {order.email || "-"}
                </p>
                <p>
                  <strong>Address:</strong> {order.address || "-"}
                </p>
                {order.note ? (
                  <p className="whitespace-pre-line">
                    <strong>Note:</strong> {order.note}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <strong>Status:</strong>
                  {(() => {
                    const st = statusLabel(order.status);
                    return (
                      <span className={`px-2 py-1 rounded text-white text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    );
                  })()}
                </p>

                <p>
                  <strong>Created:</strong>{" "}
                  {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "-"}
                </p>

                {computed.subtotal !== null && (
                  <p>
                    <strong>Subtotal:</strong> {currencyVND(computed.subtotal as any)}
                  </p>
                )}
                {computed.extras_total !== null && (
                  <p>
                    <strong>Extras:</strong> {currencyVND(computed.extras_total as any)}
                  </p>
                )}
                <p>
                  <strong>Total:</strong>{" "}
                  <span className="font-semibold text-slate-900">{currencyVND(computed.total_price)}</span>
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-2">Items</h3>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-slate-900">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="font-semibold text-slate-700">
                    <th className="p-2 border border-slate-200">Product</th>
                    <th className="p-2 border border-slate-200">Unit</th>
                    <th className="p-2 border border-slate-200">Extras</th>
                    <th className="p-2 border border-slate-200">Qty</th>
                    <th className="p-2 border border-slate-200">Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition align-top">
                      <td className="border border-slate-200 p-2">
                        <div className="flex items-start gap-3">
                          {d.product_thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.product_thumbnail}
                              alt={d.product_name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200" />
                          )}

                          <div className="min-w-0">
                            <div className="font-semibold truncate">{d.product_name || "Unknown product"}</div>

                            {d.size_name ? (
                              <div className="text-xs text-slate-600 mt-1">
                                Size: <b className="text-slate-900">{d.size_name}</b>{" "}
                                {toNumber(d.size_price_extra) > 0 ? (
                                  <span>({currencyVND(d.size_price_extra)})</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="border border-slate-200 p-2 whitespace-nowrap">{currencyVND(d.unit_price)}</td>
                      <td className="border border-slate-200 p-2 whitespace-nowrap">{currencyVND(d.extras_total)}</td>
                      <td className="border border-slate-200 p-2 text-center">{d.qty}</td>
                      <td className="border border-slate-200 p-2 font-semibold whitespace-nowrap">
                        {currencyVND(d.line_total)}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-slate-500">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
