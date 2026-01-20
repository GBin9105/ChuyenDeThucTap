"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_LOGIN_URL = "http://localhost:8000/api/auth/login";

// đổi nếu route admin của bạn khác
const ADMIN_HOME = "/admin";
const CLIENT_HOME = "/";

function isAdminUser(user: any) {
  if (!user) return false;

  // 1) role string: "admin", "ADMIN", "super_admin"...
  const role = String(user.role ?? user.type ?? "").toLowerCase();
  if (["admin", "super_admin", "superadmin"].includes(role)) return true;

  // 2) flags phổ biến
  if (user.is_admin === true || user.is_admin === 1) return true;
  if (user.isAdmin === true) return true;

  // 3) roles array: ["admin", ...] hoặc [{name:"admin"}]
  const roles = user.roles;
  if (Array.isArray(roles)) {
    const normalized = roles
      .map((r: any) => (typeof r === "string" ? r : r?.name ?? r?.slug ?? ""))
      .map((x: any) => String(x).toLowerCase());
    if (normalized.includes("admin") || normalized.includes("super_admin") || normalized.includes("superadmin")) {
      return true;
    }
  }

  return false;
}

export default function LoginPage() {
  const router = useRouter();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!loginValue || !password) {
      setError("Vui lòng nhập email/username và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: loginValue, // email OR username
          password,
        }),
      });

      // an toàn nếu BE không trả JSON trong một số lỗi
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Đăng nhập thất bại");
      }

      // token có thể là token hoặc access_token tùy BE
      const token = data?.token ?? data?.access_token;
      const user = data?.user;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // nếu role admin => chuyển qua admin
      const goAdmin = isAdminUser(user);
      router.replace(goAdmin ? ADMIN_HOME : CLIENT_HOME);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative">
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
          <p className="text-amber-400 mt-2 font-semibold">Premium Coffee & Lifestyle</p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* LOGIN INPUT */}
        <input
          type="text"
          placeholder="Email hoặc Username"
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="
            w-full mb-4 px-4 py-3 rounded-lg
            bg-white/80 text-black
            focus:outline-none focus:ring-2
            focus:ring-amber-400
          "
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          className="
            w-full mb-6 px-4 py-3 rounded-lg
            bg-white/80 text-black
            focus:outline-none focus:ring-2
            focus:ring-amber-400
          "
        />

        {/* SUBMIT */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full py-3 rounded-lg
            bg-amber-500 text-black
            font-semibold text-lg
            hover:bg-amber-400
            transition
            disabled:opacity-60
          "
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* REGISTER */}
        <p className="text-center text-gray-300 mt-6 text-sm">
          Chưa có tài khoản?{" "}
          <Link href="/account/register" className="text-amber-400 hover:underline font-medium">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
