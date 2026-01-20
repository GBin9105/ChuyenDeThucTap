"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import type { CartLine, CartTotals } from "@/services/cart.service";
import { cartService } from "@/services/cart.service";

/* =========================
 * Helpers
 * ========================= */
function currencyVND(v: any) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return String(v ?? "0");
  return n.toLocaleString("vi-VN") + " ₫";
}

function apiErrorMessage(e: any, fallback = "Thao tác thất bại.") {
  const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
  return String(msg);
}

function getProductImage(product: any): string | null {
  if (!product) return null;
  return (
    product.image ||
    product.thumbnail ||
    product.image_url ||
    product.cover ||
    (Array.isArray(product.images) ? product.images?.[0] : null) ||
    null
  );
}

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  extras_total: 0,
  grand_total: 0,
  count_lines: 0,
  count_items: 0,
};

const CART_NOTE_KEY = "cart_note_v1";

export default function CartClientPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<CartTotals>(DEFAULT_TOTALS);

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // giữ qty input local để không gọi API mỗi lần gõ
  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});

  // ===== NOTE (user nhập) =====
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    // load note từ localStorage
    try {
      const saved = localStorage.getItem(CART_NOTE_KEY);
      if (saved != null) setNote(saved);
    } catch {}
  }, []);

  useEffect(() => {
    // auto-save note vào localStorage
    try {
      localStorage.setItem(CART_NOTE_KEY, note);
    } catch {}
  }, [note]);

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncDraftFromLines = (ls: CartLine[]) => {
    const next: Record<number, string> = {};
    for (const l of ls) next[l.id] = String(Number(l.qty ?? 1));
    setQtyDraft(next);
  };

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      const ls = res?.lines ?? [];
      setLines(ls);
      setTotals(res?.totals ?? DEFAULT_TOTALS);
      syncDraftFromLines(ls);
    } catch (e: any) {
      console.error(e);
      // nếu bạn muốn redirect login khi 401 thì bật lại router
    } finally {
      setLoading(false);
    }
  };

  const commitQty = async (line: CartLine, nextQty: number) => {
    if (!line?.id) return;

    if (!Number.isFinite(nextQty) || nextQty < 1) nextQty = 1;
    if (nextQty === Number(line.qty ?? 1)) {
      setQtyDraft((prev) => ({ ...prev, [line.id]: String(nextQty) }));
      return;
    }

    setBusyId(line.id);
    try {
      await cartService.update(line.id, { qty: nextQty });
      await loadCart();
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Cập nhật số lượng thất bại."));
      // revert draft
      setQtyDraft((prev) => ({ ...prev, [line.id]: String(Number(line.qty ?? 1)) }));
    } finally {
      setBusyId(null);
    }
  };

  const handleMinus = async (line: CartLine) => {
    const cur = Number(line.qty ?? 1);
    await commitQty(line, Math.max(1, cur - 1));
  };

  const handlePlus = async (line: CartLine) => {
    const cur = Number(line.qty ?? 1);
    await commitQty(line, cur + 1);
  };

  const handleRemove = async (lineId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá sản phẩm này khỏi giỏ hàng?")) return;
    setBusyId(lineId);
    try {
      await cartService.remove(lineId);
      await loadCart();
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Xoá thất bại."));
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async () => {
    if (!confirm("Bạn có chắc chắn muốn xoá toàn bộ giỏ hàng?")) return;
    setLoading(true);
    try {
      await cartService.clear();
      await loadCart();
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Clear thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const computed = useMemo(() => {
    const countLines = lines.length;
    const countItems = lines.reduce((s, x) => s + Number(x?.qty ?? 0), 0);
    const grand = lines.reduce((s, x) => s + Number(x?.line_total ?? 0), 0);
    return { countLines, countItems, grand };
  }, [lines]);

  return (
    <>
      <Navbar />

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
              <span className="text-slate-700">Cart</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Giỏ hàng của bạn
            </h1>



            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={loadCart}
                disabled={loading}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                onClick={handleClear}
                disabled={loading || lines.length === 0}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Clear cart
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

        {/* CONTENT */}
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT: LINES */}
            <div className="lg:col-span-8">
              {lines.length === 0 && !loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="text-lg font-semibold text-slate-900">Giỏ hàng trống</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Hãy chọn vài sản phẩm yêu thích và quay lại đây để thanh toán.
                  </div>
                  <Link
                    href="/products"
                    className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Xem sản phẩm
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {lines.map((line) => {
                    const p: any = line.product || {};
                    const img = getProductImage(p);
                    const disabled = busyId === line.id;

                    const unit = Number(line.unit_price ?? 0);
                    const base = Number(p?.price_base ?? 0);
                    const isSale = base > 0 && unit > 0 && unit < base;

                    const extrasPerUnit = Number(line.extras_total ?? 0);
                    const extrasLine = extrasPerUnit * Number(line.qty ?? 0);

                    return (
                      <article
                        key={line.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex gap-4">
                          {/* image */}
                          <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={p?.name ?? "product"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                No image
                              </div>
                            )}
                          </div>

                          {/* main */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                  {p?.name ?? `Product#${line.product_id}`}
                                </h2>

                                <div className="mt-1 text-sm text-slate-600">
                                  Giá hiện hành:{" "}
                                  <b className="text-slate-900">{currencyVND(line.unit_price)}</b>
                                  {isSale ? (
                                    <span className="ml-2 text-xs text-slate-500">
                                      (Gốc:{" "}
                                      <span className="line-through">{currencyVND(base)}</span>)
                                    </span>
                                  ) : base ? (
                                    <span className="ml-2 text-xs text-slate-500">
                                      (Gốc: {currencyVND(base)})
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-1 text-sm text-slate-600">
                                  Size:{" "}
                                  {line.size_name ? (
                                    <>
                                      <b className="text-slate-900">{line.size_name}</b>{" "}
                                      {Number(line.size_price_extra ?? 0) > 0 ? (
                                        <span className="text-xs text-slate-500">
                                          (+{currencyVND(line.size_price_extra)})
                                        </span>
                                      ) : null}
                                    </>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemove(line.id)}
                                disabled={disabled}
                                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                {disabled ? "Đang xử lý..." : "Xoá"}
                              </button>
                            </div>

                            {/* qty + totals */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Số lượng:</span>

                                <button
                                  onClick={() => handleMinus(line)}
                                  disabled={disabled || Number(line.qty) <= 1}
                                  className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  -
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  value={qtyDraft[line.id] ?? String(Number(line.qty ?? 1))}
                                  disabled={disabled}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setQtyDraft((prev) => ({ ...prev, [line.id]: v }));
                                  }}
                                  onBlur={() => {
                                    const raw = qtyDraft[line.id];
                                    const n = Number(raw);
                                    const next = Number.isFinite(n)
                                      ? Math.max(1, Math.floor(n))
                                      : Number(line.qty ?? 1);
                                    commitQty(line, next);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const raw = qtyDraft[line.id];
                                      const n = Number(raw);
                                      const next = Number.isFinite(n)
                                        ? Math.max(1, Math.floor(n))
                                        : Number(line.qty ?? 1);
                                      commitQty(line, next);
                                    }
                                  }}
                                  className="h-9 w-20 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                />

                                <button
                                  onClick={() => handlePlus(line)}
                                  disabled={disabled}
                                  className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  +
                                </button>

                                {disabled ? (
                                  <span className="ml-2 text-xs text-slate-500">
                                    Đang cập nhật...
                                  </span>
                                ) : null}
                              </div>

                              <div className="text-right">
                                <div className="text-sm text-slate-600">
                                  Extras / đơn vị:{" "}
                                  <b className="text-slate-900">{currencyVND(extrasPerUnit)}</b>
                                </div>
                                <div className="text-sm text-slate-600">
                                  Extras / dòng:{" "}
                                  <b className="text-slate-900">{currencyVND(extrasLine)}</b>
                                </div>
                                <div className="text-lg font-semibold text-slate-900">
                                  {currencyVND(line.line_total)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: SUMMARY */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Tóm tắt
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Lines</span>
                      <b className="text-slate-900">{totals.count_lines ?? computed.countLines}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Items</span>
                      <b className="text-slate-900">{totals.count_items ?? computed.countItems}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <b className="text-slate-900">{currencyVND(totals.subtotal)}</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Extras</span>
                      <b className="text-slate-900">{currencyVND(totals.extras_total)}</b>
                    </div>

                    <div className="my-3 border-t border-slate-100" />

                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold text-slate-900">Grand total</span>
                      <span className="font-semibold text-slate-900">
                        {currencyVND(totals.grand_total)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="
                      mt-5 inline-flex w-full items-center justify-center
                      rounded-full bg-slate-900 px-5 py-3
                      text-sm font-semibold text-white
                      hover:bg-slate-800
                    "
                  >
                    Checkout
                  </Link>
                </div>

              </div>
            </aside>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
