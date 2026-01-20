"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { useParams, useRouter } from "next/navigation";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();

  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    roles: "user",
    status: 1 as any,
    avatar: "",
  });

  // ===================================================
  // LOAD USER
  // ===================================================
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await userService.getById(Number(id));
        const u = res?.data?.data;

        setForm({
          name: u?.name ?? "",
          email: u?.email ?? "",
          phone: u?.phone ?? "",
          username: u?.username ?? "",
          password: "",
          roles: u?.roles ?? "user",
          status: u?.status ?? 1,
          avatar: u?.avatar ?? "",
        });

        setPreview(u?.avatar ?? "");
      } catch (err) {
        console.error("Load user error:", err);
        setError("Không tải được thông tin user.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ===================================================
  // HANDLE INPUT
  // ===================================================
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "avatar") setPreview(value);
      return updated;
    });
  };

  // ===================================================
  // SUBMIT
  // ===================================================
  const handleSubmit = async () => {
    if (!id) return;
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() ? form.phone.trim() : null,
      username: form.username.trim(),
      password: form.password ? form.password : null, // optional
      roles: form.roles,
      status: Number(form.status), // ✅ đảm bảo number
      avatar: form.avatar.trim() ? form.avatar.trim() : null,
    };

    if (!payload.name || !payload.email || !payload.username) {
      setError("Vui lòng nhập đầy đủ Name, Email, Username.");
      return;
    }

    if (!payload.email.includes("@")) {
      setError("Email không hợp lệ.");
      return;
    }

    if (payload.password && payload.password.length < 4) {
      setError("Password phải có ít nhất 4 ký tự.");
      return;
    }

    try {
      setSaving(true);
      await userService.update(Number(id), payload);
      router.push("/admin/users");
    } catch (e: any) {
      console.error(e);

      const data = e?.response?.data;

      if (data?.errors && typeof data.errors === "object") {
        const firstField = Object.keys(data.errors)[0];
        const firstMsg = Array.isArray(data.errors[firstField])
          ? data.errors[firstField][0]
          : String(data.errors[firstField]);
        setError(firstMsg || "Lỗi khi cập nhật User!");
        return;
      }

      setError(data?.message || "Lỗi khi cập nhật User!");
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // UI — SAME STYLE AS EDIT PRODUCT
  // ===================================================
  return (
    <div className="p-6 flex justify-center">
      {/* CSS GLOW giống Edit Product */}
      <style>
        {`
          .glow-input {
            transition: 0.25s ease;
          }
          .glow-input:focus {
            border-color: #5aa0ff !important;
            outline: none !important;
            box-shadow:
              0 0 8px rgba(90,160,255,0.9),
              0 0 16px rgba(90,160,255,0.7),
              0 0 25px rgba(90,160,255,0.55);
          }

          .glow-btn {
            box-shadow:
              0 0 15px rgba(90,120,255,0.5),
              0 0 25px rgba(90,120,255,0.4);
            transition: 0.3s ease;
          }

          .glow-btn:hover {
            box-shadow:
              0 0 18px rgba(120,150,255,1),
              0 0 35px rgba(120,150,255,0.9),
              0 0 50px rgba(120,150,255,0.7);
          }
        `}
      </style>

      <div
        className="
          w-full max-w-3xl p-8 rounded-2xl 
          bg-white/40 backdrop-blur-md 
          border border-gray-300 
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <h2 className="text-2xl font-semibold text-black mb-6">Edit User</h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4 shadow">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-700">Đang tải dữ liệu...</div>
        ) : (
          <div className="space-y-6">
            {/* NAME */}
            <div>
              <label className="text-black font-medium">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-black font-medium">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="text-black font-medium">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className="text-black font-medium">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-black font-medium">Password (optional)</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="text-black font-medium">Role</label>
              <select
                name="roles"
                value={form.roles}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className="text-black font-medium">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            {/* AVATAR */}
            <div>
              <label className="text-black font-medium">Avatar URL</label>
              <input
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                className="
                  glow-input
                  w-full px-4 py-3 rounded-lg mt-1
                  bg-white/70 border border-gray-300 text-black
                "
              />

              {preview && (
                <img
                  src={preview}
                  className="
                    mt-3 w-32 h-32 object-cover rounded-lg
                    border border-gray-300 bg-white/70 shadow-md
                  "
                  onError={() => setPreview("")}
                  alt="avatar preview"
                />
              )}
            </div>

            {/* BUTTON — NEON GLOW */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="
                glow-btn
                w-full py-3 rounded-lg font-semibold text-white
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                disabled:opacity-60
              "
            >
              {saving ? "Updating..." : "Update User"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
