"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "@/lib/api";

type User = {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  role?: string | null;
  roles?: any; // có thể là string | array | object tuỳ BE
};

function apiErrorMessage(e: any, fallback = "Thao tác thất bại.") {
  // Laravel validation: { message: "...", errors: { email: ["..."], username: ["..."] } }
  const errors = e?.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const keys = Object.keys(errors);
    if (keys.length) {
      const first = (errors as any)[keys[0]];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === "string") return first;
    }
  }

  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
}

function normalizeRoles(u: User | null) {
  if (!u) return "—";

  if (typeof u.roles === "string" && u.roles.trim()) return u.roles;
  if (typeof u.role === "string" && u.role.trim()) return u.role;

  if (Array.isArray(u.roles)) {
    const names = u.roles
      .map((r: any) => (typeof r === "string" ? r : r?.name ?? r?.slug ?? ""))
      .filter(Boolean);
    if (names.length) return names.join(", ");
  }

  // fallback
  if (u.roles && typeof u.roles === "object") {
    const maybeName = u.roles?.name ?? u.roles?.slug;
    if (maybeName) return String(maybeName);
  }

  return "—";
}

function extractUserFromResponse(resp: any): User | null {
  const raw = resp?.data ?? resp;

  // phổ biến: { user: {...} }
  if (raw?.user && typeof raw.user === "object") return raw.user as User;

  // phổ biến: { data: { ... } } hoặc { data: { user: {...}} }
  if (raw?.data?.user && typeof raw.data.user === "object")
    return raw.data.user as User;
  if (raw?.data && typeof raw.data === "object" && raw.data.id)
    return raw.data as User;

  // đôi khi trả user thẳng
  if (raw && typeof raw === "object" && raw.id) return raw as User;

  return null;
}

/**
 * Fetch profile (CURRENT USER)
 * BE: GET /api/auth/me
 */
async function fetchProfile() {
  const res = await api.get("/auth/me");
  return extractUserFromResponse(res);
}

/**
 * Update profile OR change password (CURRENT USER)
 * BE: PUT /api/auth/me
 */
async function updateProfile(payload: any): Promise<{ user: User | null; message?: string }> {
  const res = await api.put("/auth/me", payload);
  const raw = res?.data ?? res;
  return {
    user: extractUserFromResponse(res),
    message: raw?.message,
  };
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  // edit mode (profile)
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<{ name: string; username: string; email: string }>({
    name: "",
    username: "",
    email: "",
  });

  // change password mode
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwDraft, setPwDraft] = useState<{
    current_password: string;
    password: string;
    password_confirmation: string;
  }>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  // status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const roleText = useMemo(() => normalizeRoles(user), [user]);

  /* =========================
     CHECK AUTH + LOAD PROFILE
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.replace("/account/login");
      return;
    }

    let parsed: User | null = null;
    try {
      parsed = JSON.parse(storedUser);
    } catch {
      parsed = null;
    }

    // set nhanh từ localStorage cho UI
    if (parsed) {
      setUser(parsed);
      setDraft({
        name: String(parsed.name ?? ""),
        username: String(parsed.username ?? ""),
        email: String(parsed.email ?? ""),
      });
    }

    // fetch fresh từ server để đồng bộ
    (async () => {
      try {
        setLoading(true);

        const fresh = await fetchProfile();
        if (fresh) {
          setUser(fresh);
          setDraft({
            name: String(fresh.name ?? ""),
            username: String(fresh.username ?? ""),
            email: String(fresh.email ?? ""),
          });
          localStorage.setItem("user", JSON.stringify(fresh));
        }
      } catch (e: any) {
        if (e?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/account/login");
          return;
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("profile_updated_at", String(Date.now()));
    router.replace("/account/login");
  };

  /* =========================
     EDIT PROFILE
  ========================= */
  const startEdit = () => {
    setSuccess("");
    setError("");
    setIsChangingPassword(false);

    if (user) {
      setDraft({
        name: String(user.name ?? ""),
        username: String(user.username ?? ""),
        email: String(user.email ?? ""),
      });
    }
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setSuccess("");
    setError("");
    if (user) {
      setDraft({
        name: String(user.name ?? ""),
        username: String(user.username ?? ""),
        email: String(user.email ?? ""),
      });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setError("");
    setSuccess("");

    const name = draft.name.trim();
    const username = draft.username.trim();
    const email = draft.email.trim();

    if (!name || !username || !email) {
      setError("Vui lòng nhập đầy đủ Name, Username, Email.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = { name, username, email };

      const { user: updatedFromServer, message } = await updateProfile(payload);

      const merged: User = updatedFromServer
        ? updatedFromServer
        : { ...user, name, username, email };

      setUser(merged);
      localStorage.setItem("user", JSON.stringify(merged));
      localStorage.setItem("profile_updated_at", String(Date.now()));

      setIsEditing(false);
      setSuccess(message || "Cập nhật profile thành công.");
    } catch (e: any) {
      console.error(e);

      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/account/login");
        return;
      }

      setError(apiErrorMessage(e, "Cập nhật profile thất bại."));
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     CHANGE PASSWORD
  ========================= */
  const startChangePassword = () => {
    setSuccess("");
    setError("");

    // tránh đổi mật khẩu khi đang sửa profile (tránh gửi nhầm draft chưa lưu)
    if (isEditing) {
      setError("Vui lòng lưu hoặc hủy chỉnh sửa profile trước khi đổi mật khẩu.");
      return;
    }

    setPwDraft({
      current_password: "",
      password: "",
      password_confirmation: "",
    });
    setIsChangingPassword(true);
  };

  const cancelChangePassword = () => {
    setSuccess("");
    setError("");
    setPwDraft({
      current_password: "",
      password: "",
      password_confirmation: "",
    });
    setIsChangingPassword(false);
  };

  const handleChangePassword = async () => {
    if (!user?.id) return;

    setError("");
    setSuccess("");

    const current_password = pwDraft.current_password.trim();
    const password = pwDraft.password.trim();
    const password_confirmation = pwDraft.password_confirmation.trim();

    if (!current_password || !password || !password_confirmation) {
      setError("Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== password_confirmation) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    // Backend yêu cầu name/username/email luôn required trong updateMe
    const payload = {
      name: String(user.name ?? ""),
      username: String(user.username ?? ""),
      email: String(user.email ?? ""),
      current_password,
      password,
      password_confirmation,
    };

    if (!payload.name || !payload.username || !payload.email) {
      setError("Thiếu thông tin profile hiện tại (name/username/email). Vui lòng đăng nhập lại.");
      return;
    }

    setSaving(true);
    try {
      const { user: updatedFromServer, message } = await updateProfile(payload);

      // cập nhật user (nếu BE trả về user)
      if (updatedFromServer) {
        setUser(updatedFromServer);
        localStorage.setItem("user", JSON.stringify(updatedFromServer));
      }

      localStorage.setItem("profile_updated_at", String(Date.now()));

      setIsChangingPassword(false);
      setPwDraft({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      setSuccess(message || "Đổi mật khẩu thành công.");
    } catch (e: any) {
      console.error(e);

      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/account/login");
        return;
      }

      setError(apiErrorMessage(e, "Đổi mật khẩu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const goToOrders = () => router.push("/orders");

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
          <div className="text-gray-600">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div
          className="
            w-full max-w-5xl p-8 rounded-2xl
            bg-white
            border border-gray-200
            shadow-xl
            text-gray-800
          "
        >
          {/* TITLE */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-wide">Profile</h1>
            <p className="text-amber-500 mt-2 font-semibold">Coffee Garden Member</p>
          </div>

          {/* STATUS */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* HORIZONTAL LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: USER INFO */}
            <div className="space-y-4">
              {/* Username */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="font-semibold">Username</span>
                {isEditing ? (
                  <input
                    value={draft.username}
                    onChange={(e) => setDraft((p) => ({ ...p, username: e.target.value }))}
                    className="w-56 max-w-[60%] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Username"
                    disabled={saving}
                  />
                ) : (
                  <span>{user.username ?? "—"}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="font-semibold">Name</span>
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    className="w-56 max-w-[60%] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Name"
                    disabled={saving}
                  />
                ) : (
                  <span>{user.name ?? "—"}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="font-semibold">Email</span>
                {isEditing ? (
                  <input
                    value={draft.email}
                    onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                    className="w-56 max-w-[60%] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Email"
                    disabled={saving}
                  />
                ) : (
                  <span>{user.email ?? "—"}</span>
                )}
              </div>

              {/* Role */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="font-semibold">Role</span>
                <span className="uppercase">{roleText}</span>
              </div>
            </div>

            {/* RIGHT: ACTIONS + CHANGE PASSWORD */}
            <div className="flex flex-col gap-3">
              {/* EDIT PROFILE */}
              {!isEditing ? (
                <button
                  onClick={startEdit}
                  className="
                    w-full py-3 rounded-lg
                    bg-slate-900 text-white
                    font-semibold text-lg
                    hover:bg-slate-800
                    transition
                  "
                >
                  Sửa profile
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="
                      w-full py-3 rounded-lg
                      bg-white text-gray-900
                      border border-gray-200
                      font-semibold
                      hover:bg-gray-50
                      transition
                      disabled:opacity-60
                    "
                  >
                    Hủy
                  </button>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="
                      w-full py-3 rounded-lg
                      bg-amber-400 text-black
                      font-semibold
                      hover:bg-amber-300
                      transition
                      disabled:opacity-60
                    "
                  >
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              )}

              {/* CHANGE PASSWORD */}
              {!isChangingPassword ? (
                <button
                  onClick={startChangePassword}
                  disabled={saving}
                  className="
                  w-full py-3 rounded-lg
                  bg-amber-400 text-black
                  font-semibold text-lg
                  hover:bg-amber-300
                  transition
                  disabled:opacity-60                  "
                >
                  Đổi mật khẩu
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="font-semibold mb-3">Đổi mật khẩu</div>

                  <div className="space-y-3">
                    <input
                      type="password"
                      value={pwDraft.current_password}
                      onChange={(e) =>
                        setPwDraft((p) => ({ ...p, current_password: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder="Mật khẩu hiện tại"
                      disabled={saving}
                    />

                    <input
                      type="password"
                      value={pwDraft.password}
                      onChange={(e) => setPwDraft((p) => ({ ...p, password: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder="Mật khẩu mới"
                      disabled={saving}
                    />

                    <input
                      type="password"
                      value={pwDraft.password_confirmation}
                      onChange={(e) =>
                        setPwDraft((p) => ({ ...p, password_confirmation: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder="Xác nhận mật khẩu mới"
                      disabled={saving}
                    />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={cancelChangePassword}
                        disabled={saving}
                        className="
                          w-full py-2.5 rounded-lg
                          bg-white text-gray-900
                          border border-gray-200
                          font-semibold
                          hover:bg-gray-50
                          transition
                          disabled:opacity-60
                        "
                      >
                        Hủy
                      </button>

                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="
                          w-full py-2.5 rounded-lg
                          bg-emerald-500 text-white
                          font-semibold
                          hover:bg-emerald-400
                          transition
                          disabled:opacity-60
                        "
                      >
                        {saving ? "Đang lưu..." : "Cập nhật"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GO TO ORDERS */}
              <button
                onClick={goToOrders}
                disabled={saving}
                className="
                  w-full py-3 rounded-lg
                  bg-[#00BFFF] text-white
                  border border-[#00BFFF]
                  font-semibold text-lg
                  hover:bg-[#009ACD]
                  transition
                  disabled:opacity-60
                "
              >
                Đơn hàng của tôi
              </button>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                disabled={saving}
                className="
                  w-full py-3 rounded-lg
                  bg-red-500 text-white
                  font-semibold text-lg
                  hover:bg-red-400
                  transition
                  disabled:opacity-60
                "
              >
                Logout
              </button>

            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500"></div>
        </div>
      </main>

      <Footer />
    </>
  );
}
