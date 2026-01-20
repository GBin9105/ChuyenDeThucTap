"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import Sidebar from "./sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // ❌ Không có token → redirect login
    if (!token) {
      router.replace("/login");
      return;
    }

    // LOAD USER nếu chưa có
    const loadUser = async () => {
      if (!user) {
        try {
          const res = await fetch("http://localhost:8000/api/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            router.replace("/login");
            return;
          }

          const data = await res.json();
          setUser(data.user);
        } catch {
          router.replace("/login");
          return;
        }
      }
    };

    loadUser().finally(() => setLoading(false));
  }, []);

  // ⛔ Khi đang kiểm tra → tránh nhấp nháy giao diện
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-xl text-gray-600">
        Checking admin access...
      </div>
    );
  }

  // ❌ Đã load user nhưng không phải admin
  if (user && user.roles !== "admin") {
    router.replace("/login");
    return null;
  }


  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar cố định trái */}
      <Sidebar />

      {/* Nội dung chính phải đẩy sang phải 64px */}
      <main className="flex-1 bg-gray-100 p-6 ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}



