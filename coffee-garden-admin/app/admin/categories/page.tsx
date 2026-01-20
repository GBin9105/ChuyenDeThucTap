"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryService } from "@/services/category.service";

export default function CategoryPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await categoryService.all();
    setCategories(res.data?.data || res.data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
    await categoryService.delete(id);
    loadData();
  };

  return (
    <div className="p-6">

      {/* CARD WRAPPER */}  
      <div
        className="
        w-full p-6 rounded-2xl
        bg-white/40 backdrop-blur-md
        border border-gray-300
        shadow-[0_0_25px_rgba(90,120,255,0.25)]
      "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black flex items-center gap-2">
            Categories
          </h1>

          <Link
            href="/admin/categories/create"
            className="
              px-4 py-2 rounded-lg text-white font-medium
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_15px_rgba(90,120,255,0.4)]
              transition
            "
          >
            + Add Category
          </Link>
        </div>

        {/* TABLE WRAPPER */}
        <div
          className="
          overflow-x-auto rounded-xl
          bg-white/70 backdrop-blur-md
          border border-gray-300 shadow-md
        "
        >
          <table className="w-full text-sm text-black">
            <thead className="bg-white/80 border-b border-gray-300">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Slug</th>
                <th className="p-3 border text-center w-40">Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/50 transition border-b"
                >
                  <td className="p-3 border">{item.id}</td>
                  <td className="p-3 border font-medium">{item.name}</td>
                  <td className="p-3 border text-gray-600">{item.slug}</td>

                  {/* ACTION BUTTONS */}
                  <td className="p-3 border text-center space-x-2">

                    {/* EDIT BUTTON — with glow */}
                    <Link
                      href={`/admin/categories/${item.id}/edit`}
                      className="
                        px-3 py-1 rounded-lg text-white
                        bg-yellow-500 hover:bg-yellow-600
                        shadow-[0_0_12px_rgba(255,200,80,0.45)]
                        transition
                      "
                    >
                      Edit
                    </Link>

                    {/* DELETE BUTTON — with glow */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="
                        px-3 py-1 rounded-lg text-white
                        bg-red-500 hover:bg-red-600
                        shadow-[0_0_12px_rgba(255,100,100,0.45)]
                        transition
                      "
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-600">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
