"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // ✅ PHONE
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() ? phone.trim() : null, // ✅ gửi phone (có thể null)
      username: username.trim(),
      password,
      password_confirmation: passwordConfirm,
    };

    if (!payload.name || !payload.email || !payload.username || !payload.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!payload.email.includes("@")) {
      setError("Email không hợp lệ");
      return;
    }

    if (payload.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (payload.password !== passwordConfirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Laravel validation thường trả { errors: {field: [msg]} }
        if (data?.errors && typeof data.errors === "object") {
          const firstField = Object.keys(data.errors)[0];
          const firstMsg = Array.isArray(data.errors[firstField])
            ? data.errors[firstField][0]
            : String(data.errors[firstField]);
          throw new Error(firstMsg || "Đăng ký thất bại");
        }

        throw new Error(data?.message || "Đăng ký thất bại");
      }

      // AUTO LOGIN
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div
        className="
          w-full max-w-md p-8 rounded-2xl
          bg-white/10 backdrop-blur-xl
          border border-white/20
          shadow-[0_0_30px_rgba(255,255,255,0.15)]
          text-white
        "
      >
        {/* BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-wide">Coffee Garden</h1>
          <p className="text-amber-400 mt-2 font-semibold">
            Premium Coffee & Lifestyle
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* NAME */}
        <input
          type="text"
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-3 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-3 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* PHONE */}
        <input
          type="tel"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-3 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-3 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-3 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full mb-6 px-4 py-3 rounded-lg bg-white/80 text-black
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        {/* SUBMIT */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-amber-500 text-black
                     font-semibold text-lg hover:bg-amber-400 transition
                     disabled:opacity-60"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        {/* LOGIN */}
        <p className="text-center text-gray-300 mt-6 text-sm">
          Đã có tài khoản?{" "}
          <Link
            href="/account/login"
            className="text-amber-400 hover:underline font-medium"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
