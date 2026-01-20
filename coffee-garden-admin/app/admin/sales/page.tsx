"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { saleCampaignService } from "@/services/saleCampaign.service";

/**
 * ===========================
 * SALE TYPES – ĐỒNG BỘ BE
 * ===========================
 */
type DiscountType =
  | "percent"
  | "fixed_amount"
  | "fixed_price";

export default function SaleCampaignListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /* ===== MODAL STATE ===== */
  const [open, setOpen] = useState(false);
  const [viewingCampaign, setViewingCampaign] =
    useState<any>(null);
  const [loadingItems, setLoadingItems] =
    useState(false);

  /* ================= LOAD CAMPAIGNS ================= */

  const load = async () => {
    setLoading(true);
    try {
      const res = await saleCampaignService.all();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= DATE HELPERS ================= */

  const parseDate = (d?: string) =>
    d ? new Date(d.replace(" ", "T")) : null;

  const formatDate = (d?: string) => {
    const date = parseDate(d);
    if (!date || isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("vi-VN");
  };

  /* ================= STATUS BADGE ================= */

  const renderStatusBadge = (status: string) => {
    const base =
      "inline-block px-3 py-1 text-xs font-semibold rounded-full";

    switch (status) {
      case "Upcoming":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            Upcoming
          </span>
        );
      case "Active":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            Active
          </span>
        );
      case "Ended":
        return (
          <span className={`${base} bg-gray-200 text-gray-700`}>
            Ended
          </span>
        );
      default:
        return (
          <span className={`${base} bg-red-100 text-red-700`}>
            Invalid
          </span>
        );
    }
  };

  /* ================= SALE TYPE LABEL ================= */

  const renderSaleTypeLabel = (type: DiscountType) => {
    switch (type) {
      case "percent":
        return (
          <span className="text-xs font-medium text-green-700">
            Sale %
          </span>
        );
      case "fixed_amount":
        return (
          <span className="text-xs font-medium text-orange-700">
            Giảm tiền cố định
          </span>
        );
      case "fixed_price":
        return (
          <span className="text-xs font-medium text-blue-700">
            Đồng giá
          </span>
        );
      default:
        return null;
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa chiến dịch này?\nTất cả sản phẩm áp dụng cũng sẽ bị gỡ."
      )
    )
      return;

    try {
      setDeletingId(id);
      await saleCampaignService.delete(id);
      await load();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Không thể xóa chiến dịch");
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= VIEW PRODUCTS ================= */

  const handleViewProducts = async (id: number) => {
    try {
      setOpen(true);
      setLoadingItems(true);
      const campaign = await saleCampaignService.get(id);
      setViewingCampaign(campaign);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách sản phẩm");
      setOpen(false);
    } finally {
      setLoadingItems(false);
    }
  };

  /* ================= SALE VALUE BADGE ================= */

  const renderSaleBadge = (item: any) => {
    const type: DiscountType = item.type;

    if (type === "percent") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          -{item.percent}%
        </span>
      );
    }

    if (type === "fixed_amount") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
          -₫{Number(item.sale_price).toLocaleString()}
        </span>
      );
    }

    if (type === "fixed_price") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
          ₫{Number(item.sale_price).toLocaleString()}
        </span>
      );
    }

    return null;
  };

  /* ================= UI ================= */

  return (
    <div className="p-6">
      <div className="p-6 bg-white/40 border rounded-2xl shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black">
            Sale Campaigns
          </h1>

          <Link
            href="/admin/sales/create"
            className="px-4 py-2 rounded-lg text-white bg-blue-600"
          >
            + Create Campaign
          </Link>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white/70 rounded-xl border">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : (
            <table className="w-full text-sm text-black">
              <thead className="bg-white/80 border-b">
                <tr>
                  <th className="p-3 border">ID</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Time</th>
                  <th className="p-3 border">Products</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border w-40">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((c) => {
                  const now = new Date();
                  const start = parseDate(c.from_date);
                  const end = parseDate(c.to_date);

                  const status =
                    !start || !end
                      ? "Invalid"
                      : now < start
                      ? "Upcoming"
                      : now > end
                      ? "Ended"
                      : "Active";

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-white/50"
                    >
                      <td className="p-3 border">{c.id}</td>

                      <td className="p-3 border font-medium">
                        {c.name}
                      </td>

                      <td className="p-3 border">
                        <div>From: {formatDate(c.from_date)}</div>
                        <div>To: {formatDate(c.to_date)}</div>
                      </td>

                      <td className="p-3 border text-center">
                        <button
                          onClick={() => handleViewProducts(c.id)}
                          disabled={!c.items_count}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
                        >
                          📦 {c.items_count ?? 0}
                        </button>
                      </td>

                      <td className="p-3 border text-center">
                        {renderStatusBadge(status)}
                      </td>

                      <td className="p-3 border text-center space-x-2">
                        <Link
                          href={`/admin/sales/${c.id}/edit`}
                          className="px-3 py-1 bg-yellow-500 text-white rounded"
                        >
                          Edit
                        </Link>

                        <button
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-xl p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Những Sản Phẩm Trong “{viewingCampaign?.name}”
            </h2>

            {loadingItems ? (
              <p>Loading...</p>
            ) : viewingCampaign?.items?.length === 0 ? (
              <p className="italic text-gray-500">
                No products
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {viewingCampaign?.items?.map((i: any) => (
                  <div
                    key={i.product_id}
                    className="flex items-center gap-4 p-3 border rounded"
                  >
                    <img
                      src={i.product?.thumbnail}
                      className="w-14 h-14 rounded object-cover"
                    />
                    <div>
                      <div className="font-medium">
                        {i.product?.name}
                      </div>

                      {/* 🔥 SALE TYPE + VALUE */}
                      <div className="flex items-center gap-2 mt-1">
                        {renderSaleTypeLabel(i.type)}
                        {renderSaleBadge(i)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
