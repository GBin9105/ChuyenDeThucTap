"use client";

import { useEffect, useMemo, useState } from "react";
import { cartService } from "@/services/cart.service";
import { api } from "@/lib/api";
import type { CartLine, CartTotals } from "@/services/cart.service";

/* =========================
 * HELPERS
 * ========================= */
function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function currencyVND(v: any) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return String(v ?? "0");
  return n.toLocaleString("vi-VN") + " ₫";
}

function getUnitPrice(line: any) {
  if (line?.unit_price != null) return toNumber(line.unit_price, 0);

  const p = line?.product;
  if (p?.final_price && toNumber(p.final_price) > 0) return toNumber(p.final_price, 0);
  if (p?.price_sale && toNumber(p.price_sale) > 0) return toNumber(p.price_sale, 0);
  return toNumber(p?.price_base, 0);
}

function apiErrorMessage(e: any, fallback = "Thao tác thất bại.") {
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
}

function extractLinesAndTotals(resp: any): { lines: CartLine[]; totals?: CartTotals } {
  const raw = resp?.data ?? resp;

  if (Array.isArray(raw)) return { lines: raw };

  const lines =
    (Array.isArray(raw?.data) ? raw.data : null) ||
    (Array.isArray(raw?.lines) ? raw.lines : null) ||
    (Array.isArray(raw?.data?.data) ? raw.data.data : null) ||
    (Array.isArray(raw?.data?.lines) ? raw.data.lines : null) ||
    null;

  const totals: CartTotals | undefined =
    raw?.totals && typeof raw.totals === "object"
      ? raw.totals
      : raw?.data?.totals && typeof raw.data.totals === "object"
        ? raw.data.totals
        : undefined;

  return { lines: lines ?? [], totals };
}

/* =========================
 * API ADAPTER
 * ========================= */
const svcAny = cartService as any;

async function fetchAdminCartsAll() {
  if (typeof svcAny.allAdmin === "function") return svcAny.allAdmin();
  return api.get("/admin/carts");
}

async function deleteAdminCartLine(id: number) {
  if (typeof svcAny.deleteAdmin === "function") return svcAny.deleteAdmin(id);
  return api.delete(`/admin/carts/${id}`);
}

async function clearAdminCartsAll() {
  if (typeof svcAny.clearAdmin === "function") return svcAny.clearAdmin();
  return api.delete(`/admin/carts/clear`);
}

/* =========================
 * PAGE
 * ========================= */
export default function AdminCartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [serverTotals, setServerTotals] = useState<CartTotals | null>(null);

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  const [q, setQ] = useState("");
  const [onlyActiveQty, setOnlyActiveQty] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCartsAll();
      const { lines: fetched, totals } = extractLinesAndTotals(res);

      setLines(Array.isArray(fetched) ? fetched : []);
      setServerTotals(totals ?? null);
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Load admin carts thất bại."));
      setLines([]);
      setServerTotals(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteLine = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cart line này?")) return;

    setBusyId(id);
    try {
      await deleteAdminCartLine(id);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Xóa thất bại."));
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ cart đang hoạt động?")) return;

    setClearing(true);
    try {
      await clearAdminCartsAll();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Clear tất cả carts thất bại."));
    } finally {
      setClearing(false);
    }
  };

  const filteredLines = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return lines
      .filter((l: any) => {
        if (onlyActiveQty && toNumber(l?.qty, 0) <= 0) return false;
        if (!keyword) return true;

        const userName = String(l?.user?.name ?? l?.user_name ?? "").toLowerCase();
        const userEmail = String(l?.user?.email ?? l?.user_email ?? "").toLowerCase();
        const productName = String(l?.product?.name ?? "").toLowerCase();

        const haystack = [
          String(l?.id ?? ""),
          String(l?.user_id ?? ""),
          userName,
          userEmail,
          String(l?.product_id ?? ""),
          productName,
          String(l?.size_name ?? ""),
          String(l?.line_key ?? ""),
        ]
          .filter(Boolean)
          .join(" ");

        return haystack.includes(keyword);
      })
      .sort((a: any, b: any) => {
        const ta = Date.parse(a?.updated_at ?? a?.created_at ?? "") || 0;
        const tb = Date.parse(b?.updated_at ?? b?.created_at ?? "") || 0;
        return tb - ta;
      });
  }, [lines, q, onlyActiveQty]);

  const computedTotals = useMemo(() => {
    const count_lines = filteredLines.length;
    const count_items = filteredLines.reduce((s: number, x: any) => s + toNumber(x?.qty, 0), 0);

    const subtotal = filteredLines.reduce((s: number, x: any) => {
      const unit = getUnitPrice(x);
      return s + toNumber(x?.qty, 0) * toNumber(unit, 0);
    }, 0);

    const grand_total = filteredLines.reduce(
      (s: number, x: any) => s + toNumber(x?.line_total, 0),
      0
    );

    const extras_total = Math.max(0, grand_total - subtotal);

    return { subtotal, extras_total, grand_total, count_lines, count_items };
  }, [filteredLines]);

  const displayTotals: CartTotals = computedTotals;

  return (
    <div className="p-6">
      <div
        className="
          w-full p-6 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-black">Admin — Cart</h1>


          </div>

          {/* ACTIONS + FILTER */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Check theo User ID ."
              className="h-10 w-[320px] max-w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-400"
            />


            <button
              onClick={loadAll}
              className="
                px-4 py-2 rounded-lg text-white font-medium
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                shadow-[0_0_15px_rgba(90,120,255,0.4)]
                transition disabled:opacity-60
              "
              disabled={loading || clearing}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              onClick={handleClearAll}
              className="
                px-4 py-2 rounded-lg text-white font-medium
                bg-gradient-to-r from-red-500 to-rose-600
                hover:from-red-600 hover:to-rose-700
                shadow-[0_0_15px_rgba(255,100,100,0.35)]
                transition disabled:opacity-60
              "
              disabled={loading || clearing || lines.length === 0}
              title="Xóa toàn bộ cart đang hoạt động"
            >
              {clearing ? "Clearing..." : "Clear all"}
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div
          className="
            overflow-x-auto rounded-xl
            bg-white/70 backdrop-blur-md
            border border-gray-300 shadow-md
          "
        >
          <table className="w-full text-sm text-black">
            <thead className="bg-white/80 border-b border-gray-300">
              <tr>
                <th className="p-3 border">Line ID</th>
                <th className="p-3 border">User</th>
                <th className="p-3 border">Product</th>
                <th className="p-3 border text-right">Qty</th>
                <th className="p-3 border text-right">Unit (sale)</th>
                <th className="p-3 border text-right">Extras</th>
                <th className="p-3 border text-right">Line total</th>
                <th className="p-3 border text-center w-40">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLines.map((line: any) => {
                const unit = getUnitPrice(line);
                const disabled = busyId === line.id;

                return (
                  <tr key={line.id} className="hover:bg-white/50 transition border-b align-top">
                    <td className="p-3 border">
                      <div className="font-medium">{line.id}</div>
                      <div className="text-xs text-gray-600">
                        {line.updated_at
                          ? `Updated: ${String(line.updated_at)}`
                          : line.created_at
                            ? `Created: ${String(line.created_at)}`
                            : ""}
                      </div>
                    </td>

                    <td className="p-3 border">
                      <div className="font-medium">
                        {line.user?.name ?? line.user_name ?? `User#${line.user_id ?? "?"}`}
                      </div>
                      <div className="text-xs text-gray-600">ID: {line.user_id ?? "—"}</div>
                      {line.user?.email || line.user_email ? (
                        <div className="text-xs text-gray-600">
                          {line.user?.email ?? line.user_email}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3 border">
                      <div className="font-medium">
                        {line.product?.name ?? `Product#${line.product_id ?? "?"}`}
                      </div>
                      <div className="text-xs text-gray-600">PID: {line.product_id ?? "—"}</div>

                      {line.size_name ? (
                        <div className="text-xs mt-1">
                          Size: <b>{line.size_name}</b>{" "}
                          {toNumber(line.size_price_extra, 0) > 0
                            ? `( +${currencyVND(line.size_price_extra)} )`
                            : ""}
                        </div>
                      ) : (
                        <div className="text-xs mt-1 text-gray-500">Size: —</div>
                      )}
                    </td>

                    <td className="p-3 border text-right font-medium">{toNumber(line.qty, 0)}</td>

                    <td className="p-3 border text-right">
                      <div className="font-medium">{currencyVND(unit)}</div>
                      {line.product?.price_base ? (
                        <div className="text-xs text-gray-600">
                          Base: {currencyVND(line.product.price_base)}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3 border text-right">{currencyVND(line.extras_total ?? 0)}</td>

                    <td className="p-3 border text-right font-semibold">
                      {currencyVND(line.line_total ?? 0)}
                    </td>

                    <td className="p-3 border text-center">
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        disabled={disabled || loading || clearing}
                        className="
                          px-3 py-1 rounded-lg text-white
                          bg-red-500 hover:bg-red-600
                          shadow-[0_0_12px_rgba(255,100,100,0.45)]
                          transition disabled:opacity-60
                        "
                      >
                        {disabled ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-600">
                    {loading ? "Loading..." : "No active carts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
