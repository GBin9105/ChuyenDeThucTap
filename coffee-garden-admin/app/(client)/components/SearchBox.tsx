"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  const search = () => {
    const kw = keyword.trim();
    if (!kw) return;

    const encoded = encodeURIComponent(kw);
    router.push(`/products?search=${encoded}`);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 20);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      search();
    }
  };

  return (
    <div className="relative w-full">
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search sản phẩm..."
        className="
          w-full px-4 py-2 pr-12 rounded-xl 
          bg-white/70 backdrop-blur-xl
          border border-gray-300
          shadow-sm text-gray-800
          focus:ring-2 focus:ring-amber-400/40
          focus:border-amber-400
          transition-all
        "
      />

      {/* SEARCH BUTTON */}
      <button
        onClick={search}
        aria-label="Search"
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          w-9 h-9 flex items-center justify-center
          rounded-full
          bg-white/80 backdrop-blur
          border border-gray-300
          text-gray-600
          shadow
          transition-all duration-300
          hover:text-amber-600
          hover:border-amber-400
          hover:shadow-[0_0_12px_rgba(245,158,11,0.45)]
          active:scale-95
        "
      >
        {/* SVG ICON */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  );
}
