"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

import {
  HomeIcon,
  UserGroupIcon,
  Square3Stack3DIcon,
  TagIcon,
  ShoppingCartIcon,
  NewspaperIcon,
  PhotoIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  ArchiveBoxIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: HomeIcon },
    { name: "Attributes", path: "/admin/attributes", icon: Squares2X2Icon },
    { name: "Categories", path: "/admin/categories", icon: Square3Stack3DIcon },
    { name: "Products", path: "/admin/products", icon: TagIcon },
    { name: "Inventory", path: "/admin/inventory", icon: ArchiveBoxIcon },
    { name: "Sales", path: "/admin/sales", icon: TagIcon },
    { name: "Topics", path: "/admin/topics", icon: RectangleStackIcon },
    { name: "Posts", path: "/admin/posts", icon: NewspaperIcon },

    { name: "Carts", path: "/admin/carts", icon: ShoppingCartIcon },

    { name: "Orders", path: "/admin/orders", icon: ShoppingCartIcon },
    { name: "Banners", path: "/admin/banners", icon: PhotoIcon },
    { name: "Users", path: "/admin/users", icon: UserGroupIcon },
    { name: "Menus", path: "/admin/menus", icon: Bars3Icon },
  ];

  const isActive = (p: string) => pathname.startsWith(p);

  const handleLogout = async () => {
    try {
      await api.post("/logout").catch(() => {});
    } catch {}
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <aside
      className="
        fixed left-0 top-0 h-screen w-64
        bg-[#0F1425]/80 backdrop-blur-2xl
        border-r border-white/10
        shadow-[0_0_25px_rgba(100,100,150,0.25)]
        text-white flex flex-col z-50
      "
    >
      {/* CUSTOM CSS */}
      <style>
        {`
          .scroll-hidden::-webkit-scrollbar { display: none; }
          .scroll-hidden { -ms-overflow-style: none; scrollbar-width: none; }

          @keyframes rainbow {
            0% { border-color: #ff0000; }
            16% { border-color: #ff7f00; }
            33% { border-color: #ffff00; }
            50% { border-color: #00ff00; }
            66% { border-color: #0000ff; }
            83% { border-color: #4b0082; }
            100% { border-color: #8f00ff; }
          }

          .rainbow-border {
            animation: rainbow 3s linear infinite;
            border-width: 2px !important;
          }
        `}
      </style>

      {/* HEADER */}
      <div className="px-4 py-6 border-b border-white/10">
        <h2 className="text-xl font-semibold tracking-wide text-white/90">
          Admin Panel
        </h2>
      </div>

      {/* MENU LIST */}
      <nav
        className="
          flex-1 overflow-y-scroll scroll-hidden
          px-3 py-4 space-y-2
        "
      >
        {menu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg 
                transition-all duration-300 backdrop-blur-xl
                border border-white/10
                ${
                  active
                    ? "bg-white/20 shadow-[0_0_20px_rgba(150,150,255,0.35)] text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="px-4 mb-6 mt-2">
        <button
          onClick={handleLogout}
          className="
            rainbow-border
            w-full flex items-center gap-3 justify-center 
            px-4 py-3 rounded-lg font-medium text-white
            bg-white/5 hover:bg-white/10 
            transition-all duration-300
            backdrop-blur-xl
            shadow-[0_0_12px_rgba(255,255,255,0.25)]
          "
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
