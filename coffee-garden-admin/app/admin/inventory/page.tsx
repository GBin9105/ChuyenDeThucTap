"use client";

import { useEffect, useMemo, useState } from "react";
import {
  inventoryService,
  InventoryItem,
  InventoryHistoryItem,
} from "@/services/inventory.service";

/* ================= PAGE ================= */

type Draft = Record<number, { stock: number; cost_price: number }>;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // ✅ Nháp thay đổi (chưa lưu)
  const [drafts, setDrafts] = useState<Draft>({});
  const draftCount = Object.keys(drafts).length;

  // ✅ Lưu hàng loạt
  const [saving, setSaving] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  // ✅ Modal xác nhận
  const [showConfirm, setShowConfirm] = useState(false);

  /* HISTORY MODAL */
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<InventoryHistoryItem[]>([]);
  const [historyProduct, setHistoryProduct] = useState<InventoryItem | null>(
    null
  );

  const itemsById = useMemo(() => {
    const m = new Map<number, InventoryItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  /* ================= LOAD INVENTORY ================= */
  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await inventoryService.all();
      setItems(res);
      setDrafts({}); // ✅ reload thì bỏ nháp để tránh lệch dữ liệu
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  /* ================= DRAFT HELPERS ================= */
  const getRowValue = (item: InventoryItem) => {
    const d = drafts[item.id];
    return {
      stock: d?.stock ?? item.stock,
      cost_price: d?.cost_price ?? Number(item.cost_price ?? 0),
    };
  };

  const upsertDraft = (productId: number, stock: number, cost_price: number) => {
    const original = itemsById.get(productId);
    if (!original) return;

    const origStock = Number(original.stock ?? 0);
    const origCost = Number(original.cost_price ?? 0);

    const nextStock = Number.isFinite(stock) ? stock : origStock;
    const nextCost = Number.isFinite(cost_price) ? cost_price : origCost;

    // Nếu quay về đúng giá trị gốc -> xoá khỏi drafts
    if (nextStock === origStock && nextCost === origCost) {
      setDrafts((prev) => {
        if (!prev[productId]) return prev;
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [productId]: { stock: nextStock, cost_price: nextCost },
    }));
  };

  const validateDrafts = () => {
    for (const [idStr, v] of Object.entries(drafts)) {
      const id = Number(idStr);
      if (!Number.isFinite(v.stock) || v.stock < 0) {
        return `Số lượng tồn kho không hợp lệ (ID: ${id})`;
      }
      if (!Number.isFinite(v.cost_price) || v.cost_price < 0) {
        return `Giá nhập không hợp lệ (ID: ${id})`;
      }
    }
    return "";
  };

  /* ================= SAVE ALL ================= */
  const openConfirm = () => {
    setError("");
    if (draftCount === 0) return;

    const msg = validateDrafts();
    if (msg) {
      setError(msg);
      return;
    }

    setShowConfirm(true);
  };

  const saveAll = async () => {
    setError("");
    if (draftCount === 0) {
      setShowConfirm(false);
      return;
    }

    const msg = validateDrafts();
    if (msg) {
      setError(msg);
      setShowConfirm(false);
      return;
    }

    setSaving(true);

    const ids = Object.keys(drafts).map(Number);
    const nextSavingMap: Record<number, boolean> = {};
    ids.forEach((id) => (nextSavingMap[id] = true));
    setSavingMap(nextSavingMap);

    const failed: number[] = [];

    try {
      // Lưu tuần tự để hạn chế rủi ro backend không chịu Promise.all
      for (const productId of ids) {
        const d = drafts[productId];
        try {
          await inventoryService.adjust({
            product_id: productId,
            qty: d.stock,
            price_root: d.cost_price,
          });

          // Cập nhật UI ngay sau khi lưu thành công
          setItems((prev) =>
            prev.map((i) =>
              i.id === productId
                ? { ...i, stock: d.stock, cost_price: d.cost_price }
                : i
            )
          );

          // Xoá draft đã lưu
          setDrafts((prev) => {
            const copy = { ...prev };
            delete copy[productId];
            return copy;
          });
        } catch (e) {
          console.error(e);
          failed.push(productId);
        } finally {
          setSavingMap((prev) => ({ ...prev, [productId]: false }));
        }
      }

      if (failed.length > 0) {
        setError(
          `Cập nhật thất bại cho ${failed.length} sản phẩm. Vui lòng thử lại.`
        );
      }

      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOAD HISTORY ================= */
  const openHistory = async (item: InventoryItem) => {
    setShowHistory(true);
    setHistory([]);
    setHistoryProduct(item);
    setHistoryLoading(true);

    try {
      const res = await inventoryService.history(item.id);
      setHistory(res);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="p-6 bg-white/40 backdrop-blur-md rounded-2xl border shadow">
        <h1 className="text-2xl font-semibold mb-6">Quản lý kho hàng</h1>

        {/* ✅ SEARCH + CONFIRM BUTTON (góc phải) */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="px-4 py-2 border rounded w-full max-w-md"
          />

          <button
            onClick={openConfirm}
            disabled={draftCount === 0 || saving}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              draftCount === 0
                ? "Chưa có thay đổi"
                : "Xác nhận và lưu thay đổi"
            }
          >
            {saving
              ? "Đang lưu..."
              : draftCount > 0
              ? `Xác nhận (${draftCount})`
              : "Xác nhận"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Ảnh</th>
                <th className="p-3 border">Tên</th>
                <th className="p-3 border">Giá bán</th>
                <th className="p-3 border">Giá nhập</th>
                <th className="p-3 border">Tồn</th>
                <th className="p-3 border">Lịch sử</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    Đang tải…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Không có sản phẩm
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const row = getRowValue(i);
                  const dirty = !!drafts[i.id];
                  return (
                    <InventoryRow
                      key={i.id}
                      item={i}
                      stock={row.stock}
                      costPrice={row.cost_price}
                      dirty={dirty}
                      saving={!!savingMap[i.id]}
                      onChange={(stock, cost) => upsertDraft(i.id, stock, cost)}
                      onHistory={() => openHistory(i)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= CONFIRM MODAL ================= */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl">
              <h2 className="text-lg font-semibold mb-2">
                Xác nhận thay đổi tồn kho
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Bạn sắp cập nhật <b>{draftCount}</b> sản phẩm. Vui lòng kiểm tra
                lại trước khi lưu.
              </p>

              <div className="max-h-80 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">Sản phẩm</th>
                      <th className="p-2 border">Giá nhập</th>
                      <th className="p-2 border">Tồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(drafts).map(([idStr, d]) => {
                      const id = Number(idStr);
                      const original = itemsById.get(id);
                      if (!original) return null;

                      const origCost = Number(original.cost_price ?? 0);
                      const origStock = Number(original.stock ?? 0);

                      return (
                        <tr key={id}>
                          <td className="p-2 border">{original.name}</td>
                          <td className="p-2 border">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">
                                {origCost.toLocaleString("vi-VN")} đ
                              </span>
                              <span>→</span>
                              <span className="font-semibold">
                                {Number(d.cost_price).toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                          </td>
                          <td className="p-2 border">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{origStock}</span>
                              <span>→</span>
                              <span className="font-semibold">{d.stock}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded border"
                >
                  Huỷ
                </button>

                <button
                  onClick={saveAll}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Xác nhận lưu"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= HISTORY MODAL (giữ nguyên) ================= */}
        {showHistory && historyProduct && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">
                Lịch sử kho – {historyProduct.name}
              </h2>

              {historyLoading ? (
                <div>Đang tải…</div>
              ) : history.length === 0 ? (
                <div>Chưa có lịch sử</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border">Trước</th>
                      <th className="p-2 border">Thay đổi</th>
                      <th className="p-2 border">Sau</th>
                      <th className="p-2 border">Giá nhập</th>
                      <th className="p-2 border">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="p-2 border">{h.qty_before}</td>
                        <td className="p-2 border">{h.qty_change}</td>
                        <td className="p-2 border">{h.qty_after}</td>

                        <td className="p-2 border">
                          {h.price_root !== null
                            ? `${Number(h.price_root).toLocaleString("vi-VN")} đ`
                            : "—"}
                        </td>

                        <td className="p-2 border">
                          {new Date(h.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 rounded bg-gray-600 text-white"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= ROW ================= */

function InventoryRow({
  item,
  stock,
  costPrice,
  dirty,
  saving,
  onChange,
  onHistory,
}: {
  item: InventoryItem;
  stock: number;
  costPrice: number;
  dirty: boolean;
  saving: boolean;
  onChange: (stock: number, cost: number) => void;
  onHistory: () => void;
}) {
  return (
    <tr className="border-b">
      <td className="p-3 border">
        <img
          src={item.thumbnail}
          alt={item.name}
          className="w-14 h-14 rounded object-cover"
        />
      </td>

      <td className="p-3 border">
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          {dirty && (
            <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">
              Chưa lưu
            </span>
          )}
        </div>
      </td>

      <td className="p-3 border">
        {item.price_base.toLocaleString("vi-VN")} đ
      </td>

      <td className="p-3 border">
        <input
          type="number"
          min={0}
          value={costPrice}
          onChange={(e) => onChange(stock, Number(e.target.value))}
          className="w-28 px-2 py-1 border rounded"
        />
      </td>

      <td className="p-3 border">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => onChange(Number(e.target.value), costPrice)}
          className="w-20 px-2 py-1 border rounded"
        />
      </td>

      <td className="p-3 border text-center">
        <button
          onClick={onHistory}
          className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
        >
          Lịch sử
        </button>

        {saving && (
          <div className="text-xs mt-1 text-gray-500">Đang lưu…</div>
        )}
      </td>
    </tr>
  );
}
