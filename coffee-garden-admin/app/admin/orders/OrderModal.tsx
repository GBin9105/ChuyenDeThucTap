"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

type PaymentMethod = "vnpay" | "cod" | string;
type PaymentStatus = "pending" | "success" | "failed" | string;

type AdminUser = {
  id: number;
  username?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type OrderItem = {
  id: number;
  order_id: number;

  product_id: number | null;

  product_name: string;
  product_slug?: string | null;
  product_thumbnail?: string | null;

  size_id?: number | null;
  size_name?: string | null;
  size_price_extra?: string | number;

  attribute_value_ids?: any[] | null;

  qty: number;

  unit_price: string | number;
  extras_total: string | number;
  line_total: string | number;

  options?: any;
  toppings?: any;
  attribute_values?: any;

  product?: any;
  size?: any;

  created_at?: string;
};

type AdminOrder = {
  id: number;
  order_code?: string | null;

  user_id: number | null;
  user?: AdminUser | null;

  // receiver snapshot (checkout)
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  status: number | string; // 1 pending | 2 paid | 3 canceled

  subtotal?: string | number;
  extras_total?: string | number;
  total_price: string | number;

  paid_at?: string | null;

  items?: OrderItem[];

  created_at?: string;
};

type ApiResponse<T> = { status: boolean; message?: string; data: T };

function pickText(...vals: Array<string | null | undefined>): string | null {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return null;
}

function getUsername(user?: AdminUser | null): string {
  return pickText(user?.username, user?.email) ?? "-";
}

function getCheckoutName(order?: AdminOrder | null): string {
  // họ tên nhập tại checkout => order.name
  return pickText(order?.name) ?? "-";
}

function toNumber(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function toMoneyVND(v: string | number): string {
  const n = toNumber(v);
  return n.toLocaleString("vi-VN") + " đ";
}

function statusLabel(status: number | string): { label: string; cls: string } {
  const sNum = typeof status === "number" ? status : Number(status);

  if (Number.isFinite(sNum)) {
    if (sNum === 1) {
      return { label: "pending", cls: "bg-yellow-500 shadow-[0_0_10px_rgba(255,200,0,0.4)]" };
    }
    if (sNum === 2) {
      return { label: "paid", cls: "bg-green-600 shadow-[0_0_10px_rgba(0,255,150,0.4)]" };
    }
    if (sNum === 3) {
      return { label: "canceled", cls: "bg-red-600 shadow-[0_0_10px_rgba(255,80,80,0.7)]" };
    }
  }

  const s = String(status || "unknown");
  return { label: s, cls: "bg-gray-600 shadow-[0_0_10px_rgba(120,120,120,0.35)]" };
}

export default function OrderModal({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<ApiResponse<AdminOrder>>(`/admin/orders/${orderId}`);
        if (!mounted) return;

        if (res.data?.status === false) {
          setOrder(null);
          setError(res.data?.message || "Cannot load order.");
        } else {
          setOrder(res.data?.data ?? null);
        }
      } catch (e: any) {
        if (!mounted) return;
        const msg = e?.response?.data?.message || "Cannot load order (network/server error).";
        setOrder(null);
        setError(msg);
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
      className="
        fixed inset-0
        bg-black/40 backdrop-blur-sm
        flex items-center justify-center
        z-50
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* GLASS CARD */}
      <div
        className="
          w-[780px] max-w-[95vw]
          max-h-[85vh] overflow-y-auto no-scrollbar
          p-8 rounded-2xl
          bg-white/30 backdrop-blur-xl
          border border-white/50
          shadow-[0_0_25px_rgba(90,120,255,0.35)]
          relative
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4
            text-white bg-red-500/70
            hover:bg-red-600
            shadow-[0_0_10px_rgba(255,80,80,0.7)]
            transition p-1.5 rounded-full
          "
          aria-label="Close"
          type="button"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-black tracking-wide">Order #{orderId}</h2>

            <div className="text-sm text-gray-800 mt-1">
              {order?.order_code ? (
                <span>
                  Code: <span className="font-semibold">{order.order_code}</span>
                </span>
              ) : (
                <span className="italic text-gray-700">No order_code</span>
              )}
            </div>
          </div>

          {!loading && order && (
            <div className="text-right text-sm text-gray-800">
              <div>
                Payment: <span className="font-semibold">{order.payment_method}</span> /{" "}
                <span className="font-semibold">{order.payment_status}</span>
              </div>
              <div>
                Paid at:{" "}
                <span className="font-semibold">
                  {order.paid_at ? new Date(order.paid_at).toLocaleString("vi-VN") : "-"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BODY */}
        {loading && <div className="mt-6 text-black">Loading...</div>}

        {!loading && error && (
          <div className="mt-6 p-4 rounded-xl bg-white/60 border border-white/60 text-red-700">
            {error}
          </div>
        )}

        {!loading && order && (
          <>
            {/* INFO SECTION */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
              <div className="space-y-2">
                <p>
                  <strong>Username:</strong> {getUsername(order.user)}
                </p>

                <hr className="border-white/60 my-2" />

                <p>
                  <strong>Họ và tên:</strong>{" "}
                  <span className="font-semibold">{getCheckoutName(order)}</span>
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
                    <strong>Subtotal:</strong> {toMoneyVND(computed.subtotal as any)}
                  </p>
                )}
                {computed.extras_total !== null && (
                  <p>
                    <strong>Extras:</strong> {toMoneyVND(computed.extras_total as any)}
                  </p>
                )}

                <p>
                  <strong>Total:</strong>{" "}
                  <span className="font-semibold text-blue-700">{toMoneyVND(computed.total_price)}</span>
                </p>
              </div>
            </div>

            {/* ITEMS LIST */}
            <h3 className="text-lg font-semibold text-black mt-8 mb-2">Items</h3>

            <div
              className="
                rounded-xl overflow-hidden
                border border-white/50 bg-white/40
                backdrop-blur-lg shadow-md
              "
            >
              <table className="w-full text-sm text-black">
                <thead className="bg-white/60 border-b border-gray-300">
                  <tr className="font-semibold">
                    <th className="p-2 border">Product</th>
                    <th className="p-2 border">Unit</th>
                    <th className="p-2 border">Extras</th>
                    <th className="p-2 border">Qty</th>
                    <th className="p-2 border">Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-white/40 transition align-top">
                      <td className="border p-2">
                        <div className="flex items-start gap-3">
                          {d.product_thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.product_thumbnail}
                              alt={d.product_name}
                              className="w-10 h-10 rounded-lg object-cover border border-white/60"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/60 border border-white/60" />
                          )}

                          <div className="min-w-0">
                            <div className="font-semibold text-black truncate">
                              {d.product_name || "Unknown product"}
                            </div>

                            <div className="text-xs text-gray-800 mt-1 space-y-1">
                              {d.size_name ? (
                                <div>
                                  Size: <span className="font-medium">{d.size_name}</span>{" "}
                                  {toNumber(d.size_price_extra) > 0 ? (
                                    <span>({toMoneyVND(d.size_price_extra as any)})</span>
                                  ) : null}
                                </div>
                              ) : null}

                              {Array.isArray(d.toppings) && d.toppings.length > 0 ? (
                                <div>
                                  Toppings:{" "}
                                  <span className="font-medium">
                                    {d.toppings
                                      .map((t: any) => `${t?.name ?? "?"} x${t?.qty ?? 1}`)
                                      .join(", ")}
                                  </span>
                                </div>
                              ) : null}

                              {Array.isArray(d.attribute_values) && d.attribute_values.length > 0 ? (
                                <div>
                                  Attributes:{" "}
                                  <span className="font-medium">
                                    {d.attribute_values
                                      .map((a: any) => `${a?.group_name ?? "?"}: ${a?.value_name ?? "?"}`)
                                      .join(", ")}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="border p-2 whitespace-nowrap">{toMoneyVND(d.unit_price)}</td>
                      <td className="border p-2 whitespace-nowrap">{toMoneyVND(d.extras_total)}</td>
                      <td className="border p-2 text-center">{d.qty}</td>
                      <td className="border p-2 font-semibold text-blue-700 whitespace-nowrap">
                        {toMoneyVND(d.line_total)}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-3 text-gray-600">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER TOTAL */}
            <div className="text-right text-xl font-bold mt-6 text-black">
              Total: <span className="text-blue-700">{toMoneyVND(computed.total_price)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
