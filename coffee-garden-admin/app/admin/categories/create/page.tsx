"use client";

import { useState } from "react";
import { categoryService } from "@/services/category.service";
import { useRouter } from "next/navigation";

export default function CreateCategory() {
  const [name, setName] = useState("");
  const router = useRouter();

  async function handleSubmit(e: any) {
    e.preventDefault();
    await categoryService.create({ name });
    router.push("/admin/categories");
  }

  return (
    <div className="p-6 flex justify-center">

      {/* CARD GLASS */}
      <div
        className="
          w-full max-w-xl p-8 rounded-2xl
          bg-white/50 backdrop-blur-xl
          border border-gray-300
          shadow-[0_0_25px_rgba(90,120,255,0.35)]
        "
      >
        <h1 className="text-2xl font-semibold text-black mb-6">
          Add Category
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CATEGORY NAME */}
          <div>
            <label className="text-black font-medium">Category Name</label>
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 
                text-black placeholder-gray-500
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* BUTTON */}
          <button
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_20px_rgba(90,120,255,0.45)]
              transition
            "
          >
            Save Category
          </button>
        </form>
      </div>
    </div>
  );
}
