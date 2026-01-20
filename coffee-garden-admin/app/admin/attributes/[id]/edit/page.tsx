"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

type ValueItem = {
  id?: number;
  name: string;
  price_extra: number;
};

export default function EditAttributePage() {
  const router = useRouter();
  const { id } = useParams();

  const [groupName, setGroupName] = useState("");
  const [values, setValues] = useState<ValueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================================
  // LOAD GROUP + VALUES
  // ================================
  useEffect(() => {
    api
      .get(`/admin/attributes/${id}`)
      .then((res) => {
        const g = res.data.data;
        setGroupName(g.name);

        // Ensure values include price_extra
        const mappedValues = (g.values || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          price_extra: v.price_extra ?? 0,
        }));

        setValues(mappedValues);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải dữ liệu!");
      });
  }, [id]);

  if (loading) {
    return <div className="p-6 text-lg text-black">Loading...</div>;
  }

  // ================================
  // UPDATE VALUE FIELDS
  // ================================
  const updateValueName = (index: number, name: string) => {
    const list = [...values];
    list[index].name = name;
    setValues(list);
  };

  const updateValuePrice = (index: number, price: number) => {
    const list = [...values];
    list[index].price_extra = price;
    setValues(list);
  };

  // ================================
  // ADD NEW VALUE ROW
  // ================================
  const addValue = () => {
    setValues([...values, { name: "", price_extra: 0 }]);
  };

  // ================================
  // REMOVE VALUE
  // ================================
  const removeValue = async (index: number) => {
    const item = values[index];

    if (item.id) {
      if (!confirm("Xóa value này?")) return;
      try {
        await api.delete(`/admin/attributes/value/${item.id}`);
      } catch (err) {
        console.error(err);
        alert("Không thể xóa value này!");
        return;
      }
    }

    const updated = [...values];
    updated.splice(index, 1);
    setValues(updated);
  };

  // ================================
  // SAVE CHANGES
  // ================================
  const handleSubmit = async () => {
    try {
      // 1) Update group name
      await api.put(`/admin/attributes/${id}`, {
        name: groupName,
      });

      // 2) Update or create values
      for (const item of values) {
        if (item.id) {
          await api.put(`/admin/attributes/value/${item.id}`, {
            name: item.name,
            price_extra: item.price_extra,
          });
        } else if (item.name.trim()) {
          await api.post(`/admin/attributes/${id}/value`, {
            name: item.name,
            price_extra: item.price_extra,
          });
        }
      }

      router.push("/admin/attributes");
    } catch (err) {
      console.error(err);
      setError("Lỗi khi cập nhật thuộc tính!");
    }
  };

  // ================================
  // UI — LIQUID GLASS
  // ================================
  return (
    <div className="p-6 flex justify-center">
      <div
        className="
          w-full max-w-3xl p-8 rounded-2xl 
          bg-white/40 backdrop-blur-md 
          border border-gray-300 
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <h2 className="text-2xl font-semibold text-black mb-6">
          Edit Attribute Group
        </h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4 shadow">
            {error}
          </div>
        )}

        <div className="space-y-6">

          {/* GROUP NAME */}
          <div>
            <label className="text-black font-medium">Group Name</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* VALUES LIST */}
          <div>
            <label className="text-black font-medium">Values</label>

            <div className="space-y-4 mt-3">
              {values.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center p-3 bg-white/60 border rounded-xl"
                >
                  {/* NAME INPUT */}
                  <input
                    value={item.name}
                    onChange={(e) => updateValueName(i, e.target.value)}
                    className="
                      flex-1 px-3 py-2 rounded-lg
                      bg-white/80 border text-black
                    "
                    placeholder="Value name..."
                  />

                  {/* PRICE EXTRA INPUT */}
                  <input
                    type="number"
                    value={item.price_extra}
                    onChange={(e) => updateValuePrice(i, Number(e.target.value))}
                    className="
                      w-32 px-3 py-2 rounded-lg
                      bg-white/80 border text-black
                    "
                    placeholder="Extra price"
                  />

                  {/* REMOVE BUTTON */}
                  <button
                    onClick={() => removeValue(i)}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addValue}
              className="text-blue-600 mt-3 hover:underline"
            >
              + Add Value
            </button>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSubmit}
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_18px_rgba(90,120,255,0.6)]
              transition
            "
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
