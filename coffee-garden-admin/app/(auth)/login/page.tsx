"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";
import { useUserStore } from "@/store/user-store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authService.login(form);

      localStorage.setItem("token", res.token);
      setUser(res.user);

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  }

  return (
    <div className="
      flex items-center justify-center min-h-screen 
      bg-[#0f1425] 
      bg-[radial-gradient(circle_at_top,_rgba(90,120,255,0.25),_transparent)]
    ">
      {/* CARD LIQUID GLASS */}
      <div
        className="
          w-[380px] p-8 rounded-2xl
          bg-white/10 backdrop-blur-xl 
          border border-white/20 
          shadow-[0_0_35px_rgba(90,120,255,0.25)]
        "
      >
        <h2 className="text-2xl font-semibold text-center text-white/90 mb-8">
          Xác Minh Đăng Nhập Lại Dưới Quyền QTV
        </h2>

        {/* ERROR */}
        {error && (
          <p className="text-center text-red-400 bg-red-900/20 p-2 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* USERNAME */}
          <input
            type="text"
            placeholder="Username hoặc Email"
            className="
              w-full px-4 py-3 rounded-lg 
              bg-white/10 border border-white/20 text-white
              placeholder-white/50
              focus:border-blue-400 focus:ring focus:ring-blue-300/30
              outline-none transition
            "
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            className="
              w-full px-4 py-3 rounded-lg 
              bg-white/10 border border-white/20 text-white
              placeholder-white/50
              focus:border-blue-400 focus:ring focus:ring-blue-300/30
              outline-none transition
            "
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          {/* BUTTON */}
          <button
            disabled={loading}
            className="
              w-full py-3 rounded-lg font-semibold 
              bg-gradient-to-r from-blue-500 to-indigo-500
              hover:from-blue-600 hover:to-indigo-600
              text-white shadow-[0_0_12px_rgba(90,120,255,0.3)]
              transition disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
