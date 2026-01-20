"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-5 space-y-3">
      <h2 className="text-xl font-bold">Admin Panel</h2>

      <nav className="space-y-2 mt-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/products">Products</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/users">Users</Link>
        <Link href="/banners">Banners</Link>
      </nav>
    </div>
  );
}
