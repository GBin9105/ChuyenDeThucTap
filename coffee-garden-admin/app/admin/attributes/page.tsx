"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AttributeListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/admin/attributes");
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(list);
    } catch (err) {
      console.error("LOAD ATTRIBUTES ERROR:", err);
      setItems([]);
    }
    setLoading(false);
  };

  const removeGroup = async (id: number) => {
    if (!confirm("Xóa nhóm thuộc tính này? (Sẽ xóa toàn bộ value)")) return;

    try {
      await api.delete(`/admin/attributes/${id}`);
      load();
    } catch {
      alert("Không thể xóa!");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Loading...</div>;
  }

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
          <h1 className="text-2xl font-semibold text-black">
            Attributes
          </h1>

          <Link
            href="/admin/attributes/create"
            className="
              px-4 py-2 rounded-lg text-white font-medium
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_15px_rgba(90,120,255,0.4)]
              transition
            "
          >
            + Add Attribute Group
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
                <th className="p-3 border">Attribute Group</th>
                <th className="p-3 border">Values</th>
                <th className="p-3 border">Extra Price</th>
                <th className="p-3 border text-center w-40">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-white/50 transition border-b"
                >
                  <td className="p-3 border">{group.id}</td>

                  <td className="p-3 border font-medium">
                    {group.name}
                  </td>

                  {/* VALUES */}
                  <td className="p-3 border">
                    {group.values?.length > 0 ? (
                      <div className="space-y-1">
                        {group.values.map((v: any) => (
                          <div key={v.id}>• {v.name}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        Chưa có giá trị
                      </span>
                    )}
                  </td>

                  {/* EXTRA PRICE */}
                  <td className="p-3 border">
                    {group.values?.length > 0 ? (
                      <div className="space-y-1 text-gray-600">
                        {group.values.map((v: any) => (
                          <div key={v.id}>
                            {v.price_extra > 0
                              ? `+${v.price_extra.toLocaleString()}₫`
                              : "0₫"}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-3 border text-center space-x-2">
                    <Link
                      href={`/admin/attributes/${group.id}/edit`}
                      className="
                        px-3 py-1 rounded-lg text-white
                        bg-yellow-500 hover:bg-yellow-600
                        shadow-[0_0_12px_rgba(255,200,80,0.45)]
                        transition
                      "
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => removeGroup(group.id)}
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

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-600"
                  >
                    No attributes found.
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
