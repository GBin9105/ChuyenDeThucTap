"use client";

import { FaFilter } from "react-icons/fa";

type Props = {
  onFilter: (value: string) => void;
};

export default function ProductFilter({ onFilter }: Props) {
  return (
    <div
      className="
        p-4 bg-white/70 backdrop-blur-xl 
        rounded-2xl shadow-md border border-white/50
        hover:shadow-xl transition-all duration-300
        flex flex-col gap-3
      "
    >
      {/* TITLE */}
      <div className="flex items-center gap-2">
        <FaFilter className="text-blue-600 text-lg" />
        <h3 className="font-semibold text-gray-800 text-lg tracking-wide">
          Filter Products
        </h3>
      </div>

      {/* SELECT */}
      <select
        className="
          w-full px-3 py-2 rounded-lg border bg-white text-gray-700
          shadow-sm hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-400 
          transition-all duration-300
          cursor-pointer
        "
        onChange={(e) => onFilter(e.target.value)}
      >
        <option value="">All</option>
        <option value="low">Price Low → High</option>
        <option value="high">Price High → Low</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
