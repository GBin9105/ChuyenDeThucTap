"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// VALUE TYPE
type AttributeValue = {
  name: string;
  price_extra: number;
};

export default function CreateAttributePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [values, setValues] = useState<AttributeValue[]>([
    { name: "", price_extra: 0 },
  ]);
  const [error, setError] = useState("");

  // ==========================
  // ADD NEW EMPTY VALUE ROW
  // ==========================
  const addValue = () => {
    setValues([...values, { name: "", price_extra: 0 }]);
  };

  // ==========================
  // UPDATE VALUE FIELD
  // ==========================
  const updateValueName = (index: number, value: string) => {
    const list = [...values];
    list[index].name = value;
    setValues(list);
  };

  const updateValuePrice = (index: number, price: number) => {
    const list = [...values];
    list[index].price_extra = price;
    setValues(list);
  };

  // ==========================
  // REMOVE VALUE ROW
  // ==========================
  const removeValue = (index: number) => {
    const list = [...values];
    list.splice(index, 1);
    setValues(list);
  };

  // ==========================
  // SUBMIT FORM
  // ==========================
  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Tên thuộc tính không được để trống!");
      return;
    }

    const cleanedValues = values.filter((v) => v.name.trim() !== "");

    if (cleanedValues.length === 0) {
      setError("Bạn phải nhập ít nhất 1 value cho thuộc tính!");
      return;
    }

    try {
      // 1) Tạo group
      const res = await api.post("/admin/attributes", { name });
      const groupId = res.data.data.id;

      // 2) Tạo values (có price_extra)
      for (const v of cleanedValues) {
        await api.post(`/admin/attributes/${groupId}/value`, {
          name: v.name.trim(),
          price_extra: v.price_extra ?? 0,
        });
      }

      router.push("/admin/attributes");
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        setError(err.response.data.message);
        return;
      }

      setError("Không thể tạo attribute group!");
    }
  };

  // ==========================
  // UI — LIQUID GLASS
  // ==========================
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
          Add Attribute Group + Values
        </h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4 shadow">
            {error}
          </div>
        )}

        <div className="space-y-6">
          
          {/* GROUP NAME */}
          <div>
            <label className="text-black font-medium">Attribute Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg mt-1 
                bg-white/70 border border-gray-300 text-black 
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              placeholder="Ví dụ: Size, Topping, Ice..."
            />
          </div>

          {/* VALUE LIST */}
          <div>
            <label className="text-black font-medium">Values</label>

            <div className="space-y-4 mt-3">
              {values.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center bg-white/60 p-3 rounded-xl border"
                >
                  {/* VALUE NAME */}
                  <input
                    className="
                      flex-1 px-3 py-2 rounded-lg 
                      bg-white/80 border text-black
                    "
                    placeholder="Value name (S, M, L...)"
                    value={item.name}
                    onChange={(e) => updateValueName(i, e.target.value)}
                  />

                  {/* VALUE PRICE */}
                  <input
                    type="number"
                    className="
                      w-32 px-3 py-2 rounded-lg 
                      bg-white/80 border text-black
                    "
                    placeholder="Price"
                    value={item.price_extra}
                    onChange={(e) =>
                      updateValuePrice(i, Number(e.target.value))
                    }
                  />

                  {values.length > 1 && (
                    <button
                      onClick={() => removeValue(i)}
                      className="text-red-600 font-semibold hover:underline"
                    >
                      X
                    </button>
                  )}
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

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleSubmit}
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_15px_rgba(90,120,255,0.6)]
              transition
            "
          >
            Create Attribute Group
          </button>
        </div>
      </div>
    </div>
  );
}
