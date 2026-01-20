"use client";

import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Props = {
  categories: Category[];
  activeId?: number | null;
  onSelect?: (id: number | null) => void;
  mode?: "filter" | "navigate";
};

export default function CategoryMenu({
  categories,
  activeId = null,
  onSelect,
  mode = "filter",
}: Props) {
  const router = useRouter();

  if (!categories || categories.length === 0) return null;

  const handleClick = (id: number | null) => {
    if (mode === "navigate") {
      if (id === null) router.push("/products");
      else router.push(`/products?category=${id}`);
    } else {
      onSelect?.(id);
    }
  };

  return (
    <div className="w-full flex justify-center mt-10">
      {/* ✅ 1 hàng ngang, cuộn ngang nếu dài */}
      <div
        className="
          w-full max-w-5xl
          overflow-x-auto
          scrollbar-hide
        "
      >
        <div
          className="
            flex flex-nowrap items-center justify-start
            gap-4
            px-2
            min-w-max
          "
        >
          {/* ALL */}
          <button
            onClick={() => handleClick(null)}
            className={`
              shrink-0
              min-w-[140px] px-6 py-3 rounded-xl font-semibold
              backdrop-blur-xl border transition-all
              ${
                activeId === null
                  ? "bg-amber-100 border-amber-400 shadow-[0_0_18px_rgba(255,210,90,0.55)]"
                  : "bg-white/70 border-gray-300 hover:border-amber-400"
              }
            `}
          >
            Tất cả
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleClick(c.id)}
              className={`
                shrink-0
                min-w-[140px] px-6 py-3 rounded-xl font-semibold
                backdrop-blur-xl border transition-all
                ${
                  activeId === c.id
                    ? "bg-amber-100 border-amber-400 shadow-[0_0_18px_rgba(255,210,90,0.55)]"
                    : "bg-white/70 border-gray-300 hover:border-amber-400"
                }
              `}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ scrollbar hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
