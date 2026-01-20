"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { menuService } from "@/services/menu.service";

export default function MenuEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [menus, setMenus] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  // ========================
  // LOAD DATA
  // ========================
  useEffect(() => {
    const load = async () => {
      const res = await menuService.show(Number(id));
      setForm(res.data?.data ?? res.data);

      const allMenus = await menuService.all();
      setMenus(allMenus.data?.data ?? allMenus.data);
    };

    load();
  }, [id]);

  if (!form) return <div className="p-6 text-black">Loading...</div>;

  // ========================
  // SUBMIT UPDATE
  // ========================
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await menuService.update(Number(id), form);
    router.push("/admin/menus");
  };

  return (
    <div className="p-6 flex justify-center">

      {/* CARD GLASS WRAPPER */}
      <div
        className="
          w-full max-w-xl p-8 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <h1 className="text-2xl font-semibold text-black mb-6">
          Edit Menu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* NAME */}
          <div>
            <label className="text-black font-medium">Name</label>
            <input
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                placeholder-gray-500
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* LINK */}
          <div>
            <label className="text-black font-medium">Link</label>
            <input
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                placeholder-gray-500
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>

          {/* TYPE */}
          <div>
            <label className="text-black font-medium">Type</label>
            <select
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="custom">Custom</option>
              <option value="category">Category</option>
              <option value="topic">Topic</option>
              <option value="page">Page</option>
            </select>
          </div>

          {/* PARENT */}
          <div>
            <label className="text-black font-medium">Parent</label>
            <select
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.parent_id}
              onChange={(e) =>
                setForm({ ...form, parent_id: Number(e.target.value) })
              }
            >
              <option value={0}>— No Parent —</option>
              {menus
                .filter((m) => m.id !== Number(id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          {/* POSITION */}
          <div>
            <label className="text-black font-medium">Position</label>
            <select
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.position}
              onChange={(e) =>
                setForm({ ...form, position: e.target.value })
              }
            >
              <option value="mainmenu">Main Menu</option>
              <option value="footermenu">Footer Menu</option>
            </select>
          </div>

          {/* SORT ORDER */}
          <div>
            <label className="text-black font-medium">Sort Order</label>
            <input
              type="number"
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) })
              }
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="text-black font-medium">Status</label>
            <select
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: Number(e.target.value) })
              }
            >
              <option value={1}>Active</option>
              <option value={0}>Hidden</option>
            </select>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_15px_rgba(90,120,255,0.4)]
              transition
            "
          >
            Update Menu
          </button>
        </form>
      </div>
    </div>
  );
}
