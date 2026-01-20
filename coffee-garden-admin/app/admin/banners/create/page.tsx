"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bannerService } from "@/services/banner.service";

export default function BannerCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    image: "",
    link: "",
    position: "",
    sort_order: 0,
    description: "",
    status: 1,
  });

  const [preview, setPreview] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await bannerService.create(form);
    router.push("/admin/banners");
  };

  return (
    <div className="p-6 flex justify-center">

      {/* CARD GLASS + GLOW */}
      <div
        className="
          w-full max-w-xl p-8 rounded-2xl
          bg-white/40 backdrop-blur-xl
          border border-gray-300 
          shadow-[0_0_30px_rgba(120,150,255,0.45)]
        "
      >
        <h1 className="text-2xl font-semibold text-black mb-6">
          Create Banner
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* NAME */}
          <div>
            <label className="text-black font-medium">Name</label>
            <input
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                placeholder-gray-500
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
                outline-none transition
              "
              placeholder="Banner Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* IMAGE URL + PREVIEW */}
          <div>
            <label className="text-black font-medium">Image URL</label>
            <input
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                placeholder-gray-500
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
                transition
              "
              placeholder="https://example.com/banner.jpg"
              value={form.image}
              onChange={(e) => {
                setForm({ ...form, image: e.target.value });
                setPreview(e.target.value);
              }}
            />

            {preview && (
              <img
                src={preview}
                alt="preview"
                onError={(e) => (e.currentTarget.src = "/no-image.png")}
                className="
                  mt-3 w-48 h-32 object-cover rounded-lg 
                  border border-gray-300 
                  bg-white/80
                  shadow-[0_0_20px_rgba(120,150,255,0.5)]
                "
              />
            )}
          </div>

          {/* LINK */}
          <div>
            <label className="text-black font-medium">Link (optional)</label>
            <input
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                placeholder-gray-500
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
              "
              placeholder="https://your-frontend.com/product/123"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>

          {/* POSITION */}
          <div>
            <label className="text-black font-medium">Position</label>
            <select
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
              "
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              <option value="">-- Choose Position --</option>
              <option value="home">Home</option>
              <option value="slider">Slider</option>
              <option value="banner">Banner</option>
              <option value="menu">Menu</option>
              <option value="ads">Ads</option>
              <option value="footer">Footer</option>
            </select>
          </div>

          {/* SORT ORDER */}
          <div>
            <label className="text-black font-medium">Sort Order</label>
            <input
              type="number"
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
              "
              placeholder="0"
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
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                placeholder-gray-500
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
              "
              placeholder="Description..."
              value={form.description}
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
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/80 border border-gray-300 text-black
                shadow-[0_0_10px_rgba(180,200,255,0.4)]
                focus:border-blue-500 
                focus:shadow-[0_0_15px_rgba(80,120,255,0.6)]
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
              shadow-[0_0_25px_rgba(120,150,255,0.7)]
              transition
            "
          >
            Save Banner
          </button>
        </form>
      </div>
    </div>
  );
}
