"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white px-4 py-10">
        <div className="mx-auto w-full max-w-5xl">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative">
              <p className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Coffee Garden
              </p>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Về chúng tôi
              </h1>

              <p className="mt-3 max-w-2xl text-gray-600">
                Coffee Garden là nơi bạn tìm thấy cà phê chất lượng, phong cách hiện đại và trải nghiệm mua sắm
                tiện lợi. Chúng tôi cam kết sản phẩm rõ nguồn gốc, dịch vụ minh bạch và hỗ trợ nhanh chóng.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="tel:0363636360"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Liên hệ: 0363 636 360
                </a>
                <a
                  href="#policies"
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                >
                  Xem chính sách
                </a>
              </div>
            </div>
          </section>

          {/* Content grid */}
          <section id="policies" className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Giới thiệu */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Giới thiệu</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Chúng tôi tập trung vào chất lượng sản phẩm, trải nghiệm khách hàng và sự minh bạch trong vận hành.
                Coffee Garden không chỉ bán cà phê—chúng tôi cung cấp một trải nghiệm “nhanh, sạch, rõ ràng”.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                  Sản phẩm được chọn lọc và kiểm tra chất lượng.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                  Quy trình đặt hàng đơn giản, thanh toán linh hoạt.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                  Hỗ trợ khách hàng nhanh chóng qua hotline.
                </li>
              </ul>
            </div>

            {/* Liên hệ */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Liên hệ</h2>
              <p className="mt-3 text-sm text-gray-600">
                Nếu bạn cần hỗ trợ về đơn hàng, thanh toán hoặc sản phẩm, vui lòng liên hệ:
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Hotline
                  </span>
                  <a
                    href="tel:0363636360"
                    className="text-base font-bold text-slate-900 hover:underline"
                  >
                    0363 636 360
                  </a>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Thời gian hỗ trợ: 08:00 – 22:00 (hàng ngày)
              </p>
            </div>

            {/* Chính sách bảo mật */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Chính sách bảo mật</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Coffee Garden tôn trọng và cam kết bảo vệ dữ liệu cá nhân của khách hàng. Chúng tôi chỉ thu thập
                thông tin cần thiết để xử lý đơn hàng và hỗ trợ khách hàng.
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Thông tin thu thập:</span> họ tên, số điện thoại, email, địa chỉ nhận hàng.
                </p>
                <p>
                  <span className="font-semibold">Mục đích sử dụng:</span> xác nhận đơn hàng, giao hàng, chăm sóc khách hàng,
                  cải thiện trải nghiệm.
                </p>
                <p>
                  <span className="font-semibold">Cam kết:</span> không chia sẻ dữ liệu cho bên thứ ba khi không có sự đồng ý
                  (trừ trường hợp bắt buộc theo quy định pháp luật).
                </p>
              </div>
            </div>

            {/* Điều khoản bảo mật */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Điều khoản bảo mật</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Khi sử dụng dịch vụ của Coffee Garden, bạn đồng ý với các điều khoản dưới đây nhằm đảm bảo an toàn và minh bạch.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  Không sử dụng website vào mục đích gian lận, phá hoại hoặc gây ảnh hưởng hệ thống.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  Coffee Garden có quyền từ chối phục vụ khi phát hiện hành vi vi phạm nghiêm trọng.
                </li>
              </ul>
            </div>

            {/* Chính sách mua trả hàng */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900">Chính sách mua & trả hàng</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Chúng tôi hỗ trợ đổi/trả theo các điều kiện hợp lý để bảo vệ quyền lợi khách hàng.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Điều kiện đổi/trả</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li>• Sản phẩm lỗi do nhà sản xuất hoặc giao sai sản phẩm.</li>
                    <li>• Yêu cầu đổi/trả trong thời gian sớm nhất sau khi nhận hàng.</li>
                    <li>• Sản phẩm còn nguyên vẹn (tùy loại hàng/đặc thù thực phẩm).</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Quy trình hỗ trợ</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li>• Liên hệ hotline: 0363 636 360.</li>
                    <li>• Cung cấp mã đơn hàng + mô tả vấn đề (kèm ảnh nếu có).</li>
                    <li>• Coffee Garden xác minh và phản hồi hướng xử lý.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Lưu ý: Với sản phẩm tiêu dùng/đồ uống, chính sách đổi trả có thể áp dụng theo điều kiện cụ thể.
              </p>
            </div>

            {/* Phương thức thanh toán */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900">Phương thức thanh toán</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Chúng tôi hỗ trợ các phương thức thanh toán phổ biến để thuận tiện cho khách hàng.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">COD</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Thanh toán khi nhận hàng (tiền mặt).
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">VNPay</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Thanh toán online qua cổng VNPay (thẻ nội địa/ngân hàng).
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Chuyển khoản</p>
                  <p className="mt-2 text-sm text-gray-700">
                    (Tuỳ chọn) Thanh toán chuyển khoản theo hướng dẫn khi xác nhận đơn.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer note */}
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            <p>
              Nếu bạn cần cập nhật nội dung chi tiết hơn (địa chỉ cửa hàng, email hỗ trợ, thời gian đổi trả, v.v.),
              nói mình biết để mình chuẩn hoá thành dạng “Terms/Policy” đầy đủ và có thể tái sử dụng cho nhiều trang.
            </p>
          </section>

          <div className="h-10" />
        </div>
      </main>

      <Footer />
    </>
  );
}
