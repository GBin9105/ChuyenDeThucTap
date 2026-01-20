"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function currencyVNDFromVnpAmount(vnpAmount: string) {
  // VNPay thường trả amount * 100
  const n = Number(vnpAmount ?? 0);
  if (Number.isNaN(n)) return vnpAmount;
  const vnd = n / 100;
  return vnd.toLocaleString("vi-VN") + " ₫";
}

function shortCodeLabel(code: string) {
  if (!code) return "-";
  return code;
}

export default function PaymentResultPage() {
  const sp = useSearchParams();

  const data = useMemo(() => {
    const verified = sp.get("verified") === "1";
    const success = sp.get("success") === "1";
    return {
      verified,
      success,
      txnRef: sp.get("txnRef") || "",
      vnp_ResponseCode: sp.get("vnp_ResponseCode") || "",
      vnp_TransactionStatus: sp.get("vnp_TransactionStatus") || "",
      vnp_Amount: sp.get("vnp_Amount") || "",
      message: sp.get("message") || "",
    };
  }, [sp]);

  const ok = data.success && data.verified;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-50">
        {/* HEADER giống Checkout */}
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
              <Link href="/checkout" className="hover:text-slate-700">
                Checkout
              </Link>{" "}
              <span className="mx-2">/</span>
              <span className="text-slate-700">Payment Result</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Kết quả thanh toán
            </h1>

            <p className="mt-2 max-w-3xl text-slate-600">
              Trạng thái giao dịch VNPay và thông tin phản hồi từ hệ thống.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-6">
              {/* STATUS CARD */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Status
                    </div>

                    <div className="mt-2 text-2xl font-semibold tracking-tight">
                      <span className={ok ? "text-emerald-700" : "text-rose-700"}>
                        {ok ? "Thanh toán thành công" : "Thanh toán thất bại"}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {data.message
                        ? data.message
                        : ok
                        ? "Giao dịch đã được xác thực và ghi nhận."
                        : "Giao dịch không thành công hoặc không xác thực."}
                    </div>
                  </div>

                  <div
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold border",
                      ok
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200",
                    ].join(" ")}
                  >
                    {ok ? "SUCCESS" : "FAILED"}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/orders"
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Đi tới Orders
                  </Link>

                  <Link
                    href="/products"
                    className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Tiếp tục mua
                  </Link>

                  <Link
                    href="/checkout"
                    className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Quay lại Checkout
                  </Link>
                </div>
              </section>

              {/* DETAILS CARD */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Chi tiết giao dịch
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Verified</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {String(data.verified)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Success</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {String(data.success)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                    <div className="text-xs text-slate-500">Txn Ref</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 break-all">
                      {data.txnRef || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Response Code</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {shortCodeLabel(data.vnp_ResponseCode)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Transaction Status</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {shortCodeLabel(data.vnp_TransactionStatus)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {data.vnp_Amount ? currencyVNDFromVnpAmount(data.vnp_Amount) : "-"}
                    </div>
                  </div>

                  {data.message ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                      <div className="text-xs text-slate-500">Message</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
                        {data.message}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Gợi ý</div>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                    <li>
                      Nếu bạn đã thanh toán thành công nhưng chưa thấy đơn, hãy vào{" "}
                      <b className="text-slate-900">Orders</b> để kiểm tra.
                    </li>
                    <li>
                      Nếu thất bại, bạn có thể thử lại thanh toán ở{" "}
                      <b className="text-slate-900">Checkout</b>.
                    </li>
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/orders"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Xem Orders
                    </Link>

                    <Link
                      href="/cart"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Xem giỏ hàng
                    </Link>
                  </div>
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
