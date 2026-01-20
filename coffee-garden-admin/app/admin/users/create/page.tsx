"use client";

import { useState } from "react";
import { userService } from "@/services/user.service";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    roles: "user",
    status: 1,
    avatar: "",
  });

  // ===========================
  // HANDLE INPUT
  // ===========================
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // status từ select sẽ là string => giữ trong state cũng được,
    // nhưng khi submit sẽ ép về number
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "avatar") setPreview(value);
  };

  // ===========================
  // SUBMIT
  // ===========================
  const handleSubmit = async () => {
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() ? form.phone.trim() : null,
      username: form.username.trim(),
      password: form.password,
      roles: form.roles,
      status: Number(form.status), // ✅ đảm bảo là number
      avatar: form.avatar.trim() ? form.avatar.trim() : null,
    };

    if (!payload.name || !payload.email || !payload.username || !payload.password) {
      setError("Vui lòng nhập đầy đủ Name, Email, Username, Password.");
      return;
    }

    if (!payload.email.includes("@")) {
      setError("Email không hợp lệ.");
      return;
    }

    if (payload.password.length < 4) {
      setError("Password phải có ít nhất 4 ký tự.");
      return;
    }

    try {
      setLoading(true);
      await userService.create(payload);
      router.push("/admin/users");
    } catch (e: any) {
      console.error(e);

      // Laravel thường trả errors: { field: [msg] }
      const data = e?.response?.data;

      if (data?.errors && typeof data.errors === "object") {
        const firstField = Object.keys(data.errors)[0];
        const firstMsg = Array.isArray(data.errors[firstField])
          ? data.errors[firstField][0]
          : String(data.errors[firstField]);
        setError(firstMsg || "Tạo user thất bại.");
        return;
      }

      setError(data?.message || "Tạo user thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      {/* NEON GLOW CSS (giống Edit User / Edit Product) */}
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
            transition: 0.3s;
          }

          .glow-btn:hover {
            box-shadow:
              0 0 20px rgba(120,150,255,1),
              0 0 35px rgba(120,150,255,0.9),
              0 0 50px rgba(120,150,255,0.7);
          }
        `}
      </style>

      <div
        className="
          w-full max-w-xl p-8 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <h1 className="text-2xl font-semibold text-black mb-6">Create User</h1>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
                bg-white/70 border border-gray-300 text-black
              "
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-black font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="
                glow-input
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
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
                w-full mt-1 px-4 py-3 rounded-lg
                bg-white/70 border border-gray-300 text-black
              "
            />
            {preview && (
              <img
                src={preview}
                className="
                  mt-3 w-24 h-24 object-cover rounded-lg
                  border border-gray-300 bg-white/70 shadow-md
                "
                onError={() => setPreview("")}
                alt="avatar preview"
              />
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              glow-btn
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              disabled:opacity-60
            "
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
