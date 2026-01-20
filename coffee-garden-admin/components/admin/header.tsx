"use client";

import { useAuthStore } from "@/store/auth.store";

export default function Header() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="w-full h-16 bg-white shadow flex items-center justify-between px-5">
      <h1 className="font-semibold text-lg">Coffee Garden Admin</h1>

      <button
        className="px-4 py-2 bg-red-500 text-white rounded"
        onClick={() => logout()}
      >
        Logout
      </button>
    </header>
  );
}
