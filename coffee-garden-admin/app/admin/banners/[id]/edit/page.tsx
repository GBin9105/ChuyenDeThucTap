"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { bannerService } from "@/services/banner.service";

export default function BannerEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState<any>(null);
  const [preview, setPreview] = useState("");

  // LOAD DATA
  useEffect(() => {
    const load = async () => {
      try {
        const res = await bannerService.show(Number(id));
        const banner = res.data?.data;
        setForm(banner);
        setPreview(banner.image);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await bannerService.update(Number(id), form);
    router.push("/admin/banners");
  };

  if (!form) return <div className="p-6 text-black">Loading...</div>;

  return (
    <div className="p-6 flex justify-center">

      {/* 🌟 CARD GLASS + GLOW */}
      <div
        className="
        w-full max-w-xl p-8 rounded-2xl
        bg-white/50 backdrop-blur-xl
        border border-white/30 
        shadow-[0_0_25px_rgba(90,120,255,0.45)]
        transition-all
      "
      >
        <h1 className="text-2xl font-semibold text-black mb-6">
          Edit Banner
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* NAME */}
          <div>
            <label className="text-black font-medium">Name</label>
            <input
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="text-black font-medium">Image URL</label>
            <input
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.image}
              onChange={(e) => {
                setForm({ ...form, image: e.target.value });
                setPreview(e.target.value);
              }}
            />

            {preview && (
              <img
                src={preview}
                onError={(e) => (e.currentTarget.src = "/no-image.png")}
                className="
                  mt-3 w-48 h-32 object-cover rounded-lg
                  border border-gray-300 bg-white/90
                  shadow-[0_0_15px_rgba(90,120,255,0.35)]
                "
              />
            )}
          </div>

          {/* LINK */}
          <div>
            <label className="text-black font-medium">Link</label>
            <input
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.link || ""}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>

          {/* POSITION */}
          <div>
            <label className="text-black font-medium">Position</label>
            <input
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>

          {/* SORT */}
          <div>
            <label className="text-black font-medium">Sort Order</label>
            <input
              type="number"
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) })
              }
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-black font-medium">Description</label>
            <textarea
              rows={3}
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="text-black font-medium">Status</label>
            <select
              className="
                w-full px-4 py-3 mt-1 rounded-lg
                bg-white/80 border border-gray-300 text-black
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

          {/* SAVE BUTTON */}
          <button
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_20px_rgba(90,120,255,0.45)]
              transition
            "
          >
            Update Banner
          </button>
        </form>
      </div>
    </div>
  );
}
