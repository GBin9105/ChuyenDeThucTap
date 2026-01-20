"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import OrderModal from "./OrderModal";

type PaymentMethod = "vnpay" | "cod" | string;
type PaymentStatus = "pending" | "success" | "failed" | string;

type AdminUser = {
  id: number;
  username?: string | null;
  name?: string | null; // tên hiển thị tài khoản
  full_name?: string | null;
  email?: string | null;
};

type AdminOrder = {
  id: number;
  order_code?: string | null;

  user_id: number | null;
  user?: AdminUser | null;

  // receiver snapshot (checkout)
  name: string; // <-- họ tên người checkout
  phone: string;
  email?: string | null;
  address?: string | null;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  status: number | string; // 1 pending | 2 paid | 3 canceled
  total_price: string | number;

  created_at?: string;
  updated_at?: string;
};

type LaravelPaginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ApiResponse<T> = {
  status: boolean;
  message?: string;
  data: T;
};

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

function getUserFullName(user?: AdminUser | null): string | null {
  return pickText(user?.full_name, user?.name);
}

function toMoneyVND(v: string | number): string {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  if (!Number.isFinite(n)) return "0 đ";
  return n.toLocaleString("vi-VN") + " đ";
}

function formatOrderStatus(
  status: number | string
): { label: string; tone: "gray" | "yellow" | "green" | "red" } {
  const sNum = typeof status === "number" ? status : Number(status);

  if (Number.isFinite(sNum)) {
    if (sNum === 1) return { label: "pending", tone: "yellow" };
    if (sNum === 2) return { label: "paid", tone: "green" };
    if (sNum === 3) return { label: "canceled", tone: "red" };
  }

  const s = String(status || "").toLowerCase();
  if (s.includes("pending")) return { label: String(status), tone: "yellow" };
  if (s.includes("cancel")) return { label: String(status), tone: "red" };
  if (s.includes("paid") || s.includes("success") || s.includes("complete")) {
    return { label: String(status), tone: "green" };
  }
  return { label: String(status || "unknown"), tone: "gray" };
}

function statusBadgeClass(tone: "gray" | "yellow" | "green" | "red") {
  switch (tone) {
    case "yellow":
      return "bg-yellow-200 text-yellow-800";
    case "green":
      return "bg-green-200 text-green-800";
    case "red":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [lastPage, setLastPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // filters
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    if (paymentStatus) params.payment_status = paymentStatus;
    if (paymentMethod) params.payment_method = paymentMethod;
    return params;
  }, [page, perPage, q, status, paymentStatus, paymentMethod]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<LaravelPaginator<AdminOrder>>>(
        "/admin/orders",
        { params: queryParams }
      );

      const paginator = res.data?.data;
      const list = paginator?.data ?? [];

      setOrders(list);
      setPage(paginator?.current_page ?? 1);
      setLastPage(paginator?.last_page ?? 1);
      setPerPage(Number(paginator?.per_page ?? perPage));
      setTotal(Number(paginator?.total ?? 0));
    } catch {
      setOrders([]);
      setLastPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng?")) return;

    try {
      const res = await api.delete<ApiResponse<any>>(`/admin/orders/${id}`);
      if (res.data?.status === false) {
        alert(res.data?.message || "Không thể xóa đơn hàng.");
        return;
      }
      await loadOrders();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        "Xóa thất bại (có thể đơn đã paid hoặc lỗi server).";
      alert(msg);
    }
  };

  const onApplyFilters = () => {
    setPage(1);
  };

  const onResetFilters = () => {
    setQ("");
    setStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setPage(1);
  };

  if (loading) return <div className="p-6 text-black text-lg">Loading orders...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* TITLE */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-black">Orders</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
          >
            Refresh
          </button>
        </div>
      </div>

=
      {/* TABLE CARD */}
      <div
        className="
          p-6 rounded-2xl
          bg-white/40 backdrop-blur-xl
          border border-white/50
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
          overflow-x-auto no-scrollbar
        "
      >
        <table className="min-w-[1500px] w-full text-sm text-black border-collapse">
          <thead>
            <tr
              className="
                bg-white/60 backdrop-blur-md
                text-gray-800 font-semibold
                shadow-[0_0_12px_rgba(150,150,255,0.25)]
              "
            >
              <th className="p-3 border border-white/40">ID</th>
              <th className="p-3 border border-white/40">Order Code</th>

              <th className="p-3 border border-white/40">Username</th>

              {/* Đây là cột họ tên CHECKOUT bạn yêu cầu */}
              <th className="p-3 border border-white/40">Họ và tên</th>

              <th className="p-3 border border-white/40">Phone</th>
              <th className="p-3 border border-white/40">Payment</th>
              <th className="p-3 border border-white/40">Total</th>
              <th className="p-3 border border-white/40">Status</th>
              <th className="p-3 border border-white/40">Created</th>
              <th className="p-3 border border-white/40 text-center w-52">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-600 italic">
                  No orders found.
                </td>
              </tr>
            )}

            {orders.map((o) => {
              const st = formatOrderStatus(o.status);
              const userFullName = getUserFullName(o.user);

              // họ tên checkout (receiver)
              const checkoutName = pickText(o.name) ?? "-";

              return (
                <tr
                  key={o.id}
                  className="
                    hover:bg-white/50 hover:backdrop-blur-lg
                    transition border-b border-white/40
                  "
                >
                  <td className="p-3 border border-white/40">{o.id}</td>

                  <td className="p-3 border border-white/40">
                    <span className="font-medium">{o.order_code || "-"}</span>
                  </td>

                  <td className="p-3 border border-white/40">
                    <div className="flex flex-col">
                      <span className="font-medium">{getUsername(o.user)}</span>
                      {userFullName ? (
                        <span className="text-xs text-gray-700">({userFullName})</span>
                      ) : null}
                    </div>
                  </td>

                  {/* Họ tên checkout */}
                  <td className="p-3 border border-white/40">
                    <span className="font-semibold">{checkoutName}</span>
                  </td>

                  <td className="p-3 border border-white/40">{o.phone || "-"}</td>

                  <td className="p-3 border border-white/40">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-700">
                        method: <span className="font-semibold">{o.payment_method}</span>
                      </span>
                      <span className="text-xs text-gray-700">
                        status: <span className="font-semibold">{o.payment_status}</span>
                      </span>
                    </div>
                  </td>

                  <td className="p-3 border border-white/40 font-semibold text-blue-700 whitespace-nowrap">
                    {toMoneyVND(o.total_price)}
                  </td>

                  <td className="p-3 border border-white/40">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(st.tone)}`}>
                      {st.label}
                    </span>
                  </td>

                  <td className="p-3 border border-white/40 whitespace-nowrap">
                    {o.created_at ? new Date(o.created_at).toLocaleString("vi-VN") : "-"}
                  </td>

                  <td className="p-3 border border-white/40 text-center space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedOrder(o.id)}
                      className="
                        px-4 py-1 rounded-lg text-white
                        bg-blue-600 hover:bg-blue-700
                        shadow-[0_0_10px_rgba(50,120,255,0.6)]
                        transition
                      "
                    >
                      View
                    </button>

                    <button
                      onClick={() => deleteOrder(o.id)}
                      className="
                        px-4 py-1 rounded-lg text-white
                        bg-red-500 hover:bg-red-600
                        shadow-[0_0_10px_rgba(255,0,50,0.6)]
                        transition
                      "
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-sm text-gray-700">
            Page <span className="font-semibold">{page}</span> /{" "}
            <span className="font-semibold">{lastPage}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-2 rounded-lg border transition ${
                page <= 1 ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white/70 hover:bg-white border-white/60"
              }`}
            >
              Prev
            </button>

            <button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className={`px-3 py-2 rounded-lg border transition ${
                page >= lastPage
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : "bg-white/70 hover:bg-white border-white/60"
              }`}
            >
              Next
            </button>

          </div>
        </div>
      </div>

      {/* ORDER MODAL */}
      {selectedOrder && <OrderModal orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
