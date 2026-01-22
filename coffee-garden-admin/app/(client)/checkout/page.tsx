"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import type { CartLine, CartTotals } from "@/services/cart.service";
import { cartService } from "@/services/cart.service";
import { paymentService } from "@/services/payment.service";
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

function safeParseJSON<T = any>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  extras_total: 0,
  grand_total: 0,
  count_lines: 0,
  count_items: 0,
};

const CART_NOTE_KEY = "cart_note_v1";

type PaymentMethod = "vnpay" | "cod";

export default function CheckoutPage() {
  const router = useRouter();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<CartTotals>(DEFAULT_TOTALS);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState("");

  const [note, setNote] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");

  // =========================
  // PREFILL USER (localStorage + /auth/me)
  // =========================
  const prefillUser = async () => {
    // 1) fill nhanh từ localStorage.user (nếu có)
    try {
      const cachedUser = safeParseJSON<any>(localStorage.getItem("user"));
      if (cachedUser) {
        setName((prev) => prev || (cachedUser?.name ?? ""));
        setPhone((prev) => prev || (cachedUser?.phone ?? ""));
        setEmail((prev) => prev || (cachedUser?.email ?? ""));
      }
    } catch {}

    // 2) fill chuẩn từ API /auth/me
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const u = res?.data?.user; // AuthController@me trả { user: ... }
      if (!u) return;

      setName((prev) => prev || (u?.name ?? ""));
      setPhone((prev) => prev || (u?.phone ?? ""));
      setEmail((prev) => prev || (u?.email ?? ""));

      try {
        localStorage.setItem("user", JSON.stringify(u));
      } catch {}
    } catch (e) {
      console.log("prefill /auth/me failed:", e);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_NOTE_KEY);
      if (saved != null) setNote(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_NOTE_KEY, note);
    } catch {}
  }, [note]);

  useEffect(() => {
    prefillUser();
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      setLines(res?.lines ?? []);
      setTotals(res?.totals ?? DEFAULT_TOTALS);
    } catch (e: any) {
      console.error(e);
      setLines([]);
      setTotals(DEFAULT_TOTALS);
    } finally {
      setLoading(false);
    }
  };

  const computed = useMemo(() => {
    const countLines = lines.length;
    const countItems = lines.reduce((s, x) => s + Number((x as any)?.qty ?? 0), 0);
    const grand = lines.reduce((s, x) => s + Number((x as any)?.line_total ?? 0), 0);
    return { countLines, countItems, grand };
  }, [lines]);

  const validateForm = () => {
    if (!lines || lines.length === 0) return "Giỏ hàng trống.";
    if (!name.trim()) return "Vui lòng nhập họ tên.";
    if (!phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!address.trim()) return "Vui lòng nhập địa chỉ.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    setSubmitting(true);
    try {
      // ✅ VNPay: theo flow bạn đang dùng
      if (paymentMethod === "vnpay") {
        await paymentService.createAndRedirect({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : null,
          address: address.trim() ? address.trim() : null,
          note: note?.trim() ? note.trim() : null,
        });
        return;
      }

      // ✅ COD: backend của bạn tạo order từ Cart trong DB => KHÔNG gửi items
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const { data } = await api.post(
        "/orders",
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : null,
          address: address.trim(),
          note: note?.trim() ? note.trim() : null,
          payment_method: "cod",
        },
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      const order = data?.data?.data || data?.data || data;

      try {
        await cartService.clear();
      } catch {}

      try {
        localStorage.removeItem(CART_NOTE_KEY);
      } catch {}

      if (order?.id) router.push(`/orders/${order.id}`);
      else router.push("/orders");
    } catch (e: any) {
      console.error(e);
      alert(apiErrorMessage(e, "Thanh toán thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-50">
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
              <Link href="/cart" className="hover:text-slate-700">
                Cart
              </Link>{" "}
              <span className="mx-2">/</span>
              <span className="text-slate-700">Checkout</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Thanh toán
            </h1>

            <p className="mt-2 max-w-3xl text-slate-600">
              Xác nhận thông tin nhận hàng và chọn phương thức thanh toán (VNPay / COD).
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={loadCart}
                disabled={loading}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <Link
                href="/cart"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Quay lại giỏ hàng
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-10">
          {lines.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">Giỏ hàng trống</div>
              <div className="mt-2 text-sm text-slate-600">
                Hãy thêm sản phẩm vào giỏ trước khi checkout.
              </div>
              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Xem sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Thông tin nhận hàng</h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label className="text-sm font-medium text-slate-700">Họ và tên *</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400"
                        placeholder="09xxxxxxxx"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Địa chỉ *</label>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Phương thức thanh toán</h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("vnpay")}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        paymentMethod === "vnpay"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">VNPay</div>
                      <div className="mt-1 text-xs opacity-80">
                        Thanh toán online, hệ thống tạo Order khi VNPay trả về success.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        paymentMethod === "cod"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">COD</div>
                      <div className="mt-1 text-xs opacity-80">Thanh toán khi nhận hàng.</div>
                    </button>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Sản phẩm</h2>

                  <div className="mt-4 space-y-3">
                    {lines.map((line: any) => {
                      const p: any = line?.product || {};
                      const img = getProductImage(p);

                      return (
                        <div
                          key={line.id}
                          className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={p?.name ?? "product"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">
                              {p?.name ?? `Product#${line?.product_id}`}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              Qty: <b className="text-slate-900">{Number(line?.qty ?? 1)}</b> • Unit:{" "}
                              <b className="text-slate-900">{currencyVND(line?.unit_price)}</b>
                              {line?.size_name ? (
                                <>
                                  {" "}
                                  • Size: <b className="text-slate-900">{line.size_name}</b>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-slate-600">Line total</div>
                            <div className="text-base font-semibold text-slate-900">
                              {currencyVND(line?.line_total)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

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

                    <button
                      onClick={handleSubmit}
                      disabled={submitting || loading || lines.length === 0}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {submitting
                        ? "Đang xử lý..."
                        : paymentMethod === "vnpay"
                        ? "Thanh toán VNPay"
                        : "Đặt hàng COD"}
                    </button>

                    <div className="mt-3 text-xs text-slate-500">
                      {paymentMethod === "vnpay"
                        ? "Bạn sẽ được chuyển qua VNPay để thanh toán."
                        : "Đơn hàng sẽ được tạo ngay khi bấm đặt hàng."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Lưu ý</div>

                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                      <li>
                        COD: hệ thống tạo đơn ngay và bạn có thể xem trong mục{" "}
                        <b className="text-slate-900">Orders</b> ở trong{" "}
                        <b className="text-slate-900">Profile</b>.
                      </li>
                    </ul>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/profile"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Xem đơn hàng
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
