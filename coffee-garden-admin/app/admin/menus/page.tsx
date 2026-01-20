"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { menuService } from "@/services/menu.service";

export default function MenuListPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const res = await menuService.all();
      setMenus(res.data?.data ?? res.data);
    } catch {
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa menu này?")) return;
    await menuService.delete(id);
    loadMenus();
  };

  if (loading) return <div className="p-6 text-black">Loading...</div>;

  return (
    <div className="p-6 space-y-6">

      {/* TITLE + BUTTON */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-black">Menus</h1>

        <Link
          href="/admin/menus/create"
          className="
            px-5 py-2 rounded-lg text-white font-medium
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-700 hover:to-indigo-700
            shadow-[0_0_12px_rgba(90,120,255,0.5)]
            hover:shadow-[0_0_18px_rgba(90,120,255,0.7)]
            transition
          "
        >
          + Add Menu
        </Link>
      </div>

      {/* GLASS CARD WRAPPER */}
      <div
        className="
          p-5 rounded-2xl
          bg-white/40 backdrop-blur-xl
          border border-white/50
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
          overflow-x-auto
        "
      >
        {/* TABLE */}
        <table className="min-w-[1100px] w-full text-sm text-black border-collapse">

          {/* TABLE HEADER */}
          <thead>
            <tr
              className="
                bg-white/60 backdrop-blur-md
                text-gray-800 font-semibold
                shadow-[0_0_12px_rgba(150,150,255,0.25)]
              "
            >
              <th className="p-3 border border-white/40">ID</th>
              <th className="p-3 border border-white/40">Name</th>
              <th className="p-3 border border-white/40">Link</th>
              <th className="p-3 border border-white/40">Type</th>
              <th className="p-3 border border-white/40">Position</th>
              <th className="p-3 border border-white/40">Sort</th>
              <th className="p-3 border border-white/40">Parent</th>
              <th className="p-3 border border-white/40 text-center w-[160px]">
                Actions
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {menus.map((m) => (
              <tr
                key={m.id}
                className="
                  hover:bg-white/50 hover:backdrop-blur-lg
                  transition
                  border-b border-white/40
                "
              >
                <td className="p-3 border border-white/40">{m.id}</td>
                <td className="p-3 border border-white/40">{m.name}</td>
                <td className="p-3 border border-white/40">{m.link || "—"}</td>
                <td className="p-3 border border-white/40">{m.type}</td>
                <td className="p-3 border border-white/40">{m.position}</td>
                <td className="p-3 border border-white/40">{m.sort_order}</td>
                <td className="p-3 border border-white/40">{m.parent_id || "—"}</td>

                <td className="p-3 border border-white/40 text-center space-x-2">

                  {/* EDIT BUTTON */}
                  <Link
                    href={`/admin/menus/${m.id}/edit`}
                    className="
                      px-3 py-1 rounded-lg text-white
                      bg-yellow-500 shadow
                      hover:shadow-[0_0_10px_rgba(255,200,0,0.6)]
                      hover:bg-yellow-600 transition
                    "
                  >
                    Edit
                  </Link>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => deleteMenu(m.id)}
                    className="
                      px-3 py-1 rounded-lg text-white
                      bg-red-500 shadow
                      hover:shadow-[0_0_10px_rgba(255,0,50,0.6)]
                      hover:bg-red-600 transition
                    "
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}

            {menus.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-600 italic">
                  No menus found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
