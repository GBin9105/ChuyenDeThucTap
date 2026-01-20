"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 bg-black text-white border-t border-white/10">
      <style>
        {`
          .glow {
            text-shadow:
              0 0 8px rgba(255,255,255,0.45),
              0 0 16px rgba(255,255,255,0.22);
          }
        `}
      </style>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* LEFT — MAP */}
          <div className="flex justify-center md:justify-start">
            <iframe
              title="Google Map"
src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.520119894458!2d106.77285871533446!3d10.830709860835848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752701a34a5d5f%3A0x30056b2fdf668565!2zQ2FvIMSQ4bqzbmcgQ8O0bmcgVGjGsMahbmcgVFAuSENN!5e0!3m2!1svi!2s!4v1705645000000!5m2!1svi!2s"              width="360"
              height="300"
              loading="lazy"
              className="rounded-2xl"
              style={{ filter: "brightness(0.92)" }}
            ></iframe>
          </div>

          {/* RIGHT — LOGO + INFO */}
          <div className="text-center md:text-left">
            {/* Brand row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Image
                src="/logo.png"
                alt="Coffee Garden Logo"
                width={72}
                height={72}
                className="rounded-full shadow-[0_0_18px_rgba(255,255,255,0.14)]"
                priority
              />

              <div className="min-w-0">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-wide glow leading-tight">
                  Coffee Garden
                </h2>
                <p className="text-amber-300 font-semibold mt-2">
                  Premium Coffee Shop Website
                </p>
                <p className="text-gray-300 mt-1">
                  Enjoy the best organic coffee every day.
                </p>
              </div>
            </div>

            {/* Info lines */}
            <div className="mt-7 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-amber-300"></span>
                <div>
                  <div className="text-sm text-white/60">Thương hiệu</div>
                  <div className="text-base font-semibold">Coffee Garden</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-amber-300"></span>
                <div>
                  <div className="text-sm text-white/60">Địa chỉ</div>
                  <div className="text-base font-semibold">
                    Trường Cao Đẳng Công Thương TP.HCM
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-amber-300"></span>
                <div>
                  <div className="text-sm text-white/60">CSKH</div>
                  <a
                    href="mailto:support@coffeegarden.vn"
                    className="text-base font-semibold text-amber-200 hover:text-amber-100 transition"
                  >
                    support@coffeegarden.vn
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-amber-300"></span>
                <div>
                  <div className="text-sm text-white/60">Giờ làm việc</div>
                  <div className="text-base font-semibold">8.00AM - 21.00PM</div>
                </div>
              </div>
            </div>

            {/* Divider + Buttons + copyright */}
            <div className="mt-8 pt-5 border-t border-white/10">
              {/* Buttons row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 justify-center md:justify-start">
                {/* ✅ Unified button base: same padding/height/shape for all 3 */}
                {/* About Us */}
                <Link
                  href="/about"
                  className="
                    inline-flex items-center justify-center gap-2
                    h-12
                    rounded-full
                    border border-white/15
                    bg-white/5
                    px-5
                    text-sm font-semibold
                    text-white/90
                    shadow-[0_0_18px_rgba(255,255,255,0.08)]
                    hover:bg-white/10 hover:border-white/25
                    hover:shadow-[0_0_26px_rgba(255,255,255,0.16)]
                    transition
                    focus:outline-none focus:ring-2 focus:ring-amber-400/60
                    select-none
                  "
                >
                  <span
                    className="
                      inline-flex h-8 w-8 items-center justify-center
                      rounded-full bg-white/10
                      ring-1 ring-white/15
                      text-white/80
                    "
                    aria-hidden="true"
                  >
                    {/* info icon */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 17v-6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 8h.01"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </span>

                  <span>About Us</span>
                </Link>

                {/* Phone (static button, no link) */}
                <button
                  type="button"
                  className="
                    inline-flex items-center justify-center gap-2
                    h-12
                    rounded-full
                    border border-white/15
                    bg-white/5
                    px-5
                    text-sm font-semibold
                    text-white/90
                    shadow-[0_0_18px_rgba(255,255,255,0.08)]
                    hover:bg-white/10 hover:border-white/25
                    hover:shadow-[0_0_26px_rgba(255,255,255,0.16)]
                    transition
                    select-none
                  "
                  aria-label="Phone"
                >
                  <span
                    className="
                      inline-flex h-8 w-8 items-center justify-center
                      rounded-full bg-amber-400/15
                      ring-1 ring-amber-300/25
                      text-amber-200
                    "
                    aria-hidden="true"
                  >
                    {/* phone icon */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.8 3.5h3.05c.54 0 .99.38 1.09.9l.55 2.86c.09.48-.16.96-.61 1.17l-1.76.83c1.2 2.6 3.3 4.7 5.9 5.9l.83-1.76c.21-.45.69-.7 1.17-.61l2.86.55c.52.1.9.55.9 1.09v3.05c0 .62-.48 1.12-1.1 1.16C10.6 21.1 2.9 13.4 3.64 4.6c.04-.62.54-1.1 1.16-1.1Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>0363636360</span>
                </button>

                {/* Facebook (static button, no link) */}
                <button
                  type="button"
                  className="
                    inline-flex items-center justify-center gap-2
                    h-12
                    rounded-full
                    border border-white/15
                    bg-white/5
                    px-5
                    text-sm font-semibold
                    text-white/90
                    shadow-[0_0_18px_rgba(255,255,255,0.08)]
                    hover:bg-white/10 hover:border-white/25
                    hover:shadow-[0_0_26px_rgba(255,255,255,0.16)]
                    transition
                    select-none
                  "
                  aria-label="Facebook"
                >
                  <span
                    className="
                      inline-flex h-8 w-8 items-center justify-center
                      rounded-full bg-sky-400/10
                      ring-1 ring-sky-300/20
                      text-sky-200
                    "
                    aria-hidden="true"
                  >
                    {/* facebook icon */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.55.45-1 1-1Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span>Coffee Garden</span>
                </button>
              </div>

              <p className="mt-5 text-sm text-white/45">
                © {new Date().getFullYear()} Coffee Garden — All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
