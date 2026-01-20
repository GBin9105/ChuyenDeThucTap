"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBox from "./SearchBox";

// ✅ Heroicons
import {
  RectangleStackIcon, // Products
  NewspaperIcon, // Blog
  ShoppingCartIcon, // Cart
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string;
};

function isAdminRole(roles?: string) {
  const r = String(roles ?? "").toLowerCase();
  return r === "admin" || r.includes("admin");
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  /* =========================
     CHECK LOGIN STATUS
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const isAdmin = isAdminRole(user?.roles);

  return (
    <header className="sticky top-0 z-50 bg-white/40 backdrop-blur-xl shadow-lg">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex flex-col items-center group">
          <Image
            src="/logo.png"
            alt="Coffee Garden Logo"
            width={55}
            height={55}
            className="rounded-full shadow-md mb-0.5"
          />
          <span className="brand-rainbow">COFFEE GARDEN</span>
        </Link>

        {/* MENU ICONS */}
        <div className="hidden md:flex items-center gap-2 text-gray-700">
          <Link
            href="/products"
            className="nav-icon"
            title="Products"
            aria-label="Products"
          >
            <RectangleStackIcon className="w-6 h-6" />
          </Link>

          <Link href="/blog" className="nav-icon" title="Blog" aria-label="Blog">
            <NewspaperIcon className="w-6 h-6" />
          </Link>

          <Link href="/cart" className="nav-icon" title="Cart" aria-label="Cart">
            <ShoppingCartIcon className="w-6 h-6" />
          </Link>
        </div>

        {/* SEARCH */}
        <div className="hidden md:block w-[260px]">
          <SearchBox />
        </div>

        {/* AUTH */}
        <div className="flex items-center gap-4">
          {/* NOT LOGIN */}
          {!user && (
            <Link
              href="/account/login"
              className="hidden md:inline-flex px-5 py-2 rounded-xl font-semibold
                         bg-amber-400 text-black hover:bg-amber-300 transition"
            >
              Login
            </Link>
          )}

          {/* LOGGED IN */}
          {user && (
            <div className="hidden md:flex items-center gap-3">
              {/* ✅ ADMIN BUTTON (only admin) */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="
                    px-4 py-2 rounded-xl font-semibold
                    bg-indigo-600 text-white
                    hover:bg-indigo-700 transition
                  "
                  title="Đi tới trang quản trị"
                >
                  Admin
                </Link>
              )}

              {/* USER ICON + NAME */}
              <Link
                href="/profile"
                className="
                  flex items-center gap-2
                  px-4 py-2 rounded-xl
                  bg-white/70 backdrop-blur
                  border border-gray-300
                  hover:border-amber-400
                  transition
                "
              >
                <span className="text-xl">👤</span>
                <span className="font-semibold text-gray-800">{user.username}</span>
              </Link>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className="
                  px-4 py-2 rounded-xl font-semibold
                  bg-red-500 text-white
                  hover:bg-red-400 transition
                "
              >
                Logout
              </button>
            </div>
          )}

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-700"
            aria-label="Toggle menu"
          >
            {open ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-white/70 backdrop-blur-xl py-4 px-6 space-y-4 border-t">
          <SearchBox />

          <Link
            href="/products"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <RectangleStackIcon className="w-6 h-6" />
            <span>Products</span>
          </Link>

          <Link
            href="/blog"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <NewspaperIcon className="w-6 h-6" />
            <span>Blog</span>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <span>Cart</span>
          </Link>

          {!user ? (
            <Link
              href="/account/login"
              className="block text-center px-5 py-3 rounded-xl
                         bg-amber-400 text-black font-semibold"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          ) : (
            <>
              {/* ✅ ADMIN BUTTON (mobile) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block text-center px-5 py-3 rounded-xl
                             bg-indigo-600 text-white font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              )}

              <Link
                href="/profile"
                className="block text-center px-5 py-3 rounded-xl
                           bg-white text-black font-semibold"
                onClick={() => setOpen(false)}
              >
                👤 {user.username}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full px-5 py-3 rounded-xl
                           bg-red-500 text-white font-semibold"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}

      {/* CSS */}
      <style>{`
        .nav-icon{
          position:relative;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:44px;
          height:44px;
          border-radius:14px;
          color:#374151;
          transition:.2s;
        }
        .nav-icon:hover{
          background:rgba(255,255,255,0.75);
          color:#111827;
        }
        .nav-icon::after{
          content:"";
          position:absolute;
          left:10px;
          right:10px;
          bottom:8px;
          height:2px;
          width:0;
          margin:auto;
          background:#4f46e5;
          transition:.25s;
        }
        .nav-icon:hover::after{
          width:calc(100% - 20px);
        }

        .brand-rainbow{
          font-size:.9rem;
          font-weight:900;
          letter-spacing:.15em;
          background:linear-gradient(
            90deg,#ff0040,#ff7a00,#ffee00,#32ff7e,#00d1ff,#0066ff,#b400ff
          );
          background-size:300% 300%;
          -webkit-background-clip:text;
          color:transparent;
          animation:rainbowFlow 6s ease infinite;
        }
        @keyframes rainbowFlow{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
      `}</style>
    </header>
  );
}
