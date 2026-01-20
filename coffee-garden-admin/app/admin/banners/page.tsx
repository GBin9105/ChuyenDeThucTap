"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bannerService } from "@/services/banner.service";

export default function BannerListPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const res = await bannerService.all();
      setBanners(res.data?.data || []);
    } catch (err) {
      console.error("Load banner error:", err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
    await bannerService.delete(id);
    loadBanners();
  };

  if (loading)
    return <div className="p-6 text-black text-lg">Loading...</div>;

  return (
    <div className="p-6 flex justify-center">
      <div
        className="
        w-full max-w-5xl p-6 rounded-2xl 
        bg-white/40 backdrop-blur-md 
        border border-gray-300 
        shadow-[0_0_25px_rgba(90,120,255,0.35)]
      "
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-black">Banners</h1>

          <Link
            href="/admin/banners/create"
            className="
              px-4 py-2 rounded-lg text-white font-medium
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_10px_rgba(90,120,255,0.5)]
              transition
            "
          >
            + Add Banner
          </Link>
        </div>

        {/* TABLE */}
        <div
          className="
          overflow-x-auto rounded-xl 
          bg-white/60 backdrop-blur-md
          border border-gray-300 
          shadow-[0_0_20px_rgba(120,150,255,0.3)]
        "
        >
          <table className="min-w-max w-full text-sm text-black">
            <thead className="bg-white/70 border-b border-gray-300">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Image</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Link</th>
                <th className="p-3 border">Position</th>
                <th className="p-3 border">Sort</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {banners.map((b) => (
                <tr
                  key={b.id}
                  className="
                    hover:bg-white/70 
                    transition shadow-sm hover:shadow-[0_0_12px_rgba(100,140,255,0.4)]
                  "
                >
                  <td className="p-3 border">{b.id}</td>

                  <td className="p-3 border">
                    <img
                      src={b.image || "/no-image.png"}
                      alt={b.name}
                      className="
                        w-16 h-16 rounded-lg object-cover
                        border border-gray-300 
                        shadow-[0_0_8px_rgba(120,150,255,0.35)]
                      "
                    />
                  </td>

                  <td className="p-3 border">{b.name}</td>

                  {/* 🔗 LINK DISPLAY */}
                  <td className="p-3 border">
                    {b.link ? (
                      <a
                        href={b.link}
                        target="_blank"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {b.link}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  <td className="p-3 border">{b.position}</td>
                  <td className="p-3 border">{b.sort_order}</td>

                  <td className="p-3 border">
                    {b.status === 1 ? (
                      <span className="text-green-700 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Hidden
                      </span>
                    )}
                  </td>

                  <td className="p-3 border text-center space-x-2">
                    <Link
                      href={`/admin/banners/${b.id}/edit`}
                      className="
                        px-3 py-1 rounded-lg text-white
                        bg-yellow-500 hover:bg-yellow-600
                        shadow-[0_0_8px_rgba(255,200,0,0.45)]
                        hover:shadow-[0_0_12px_rgba(255,200,0,0.55)]
                        transition
                      "
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deleteBanner(b.id)}
                      className="
                        px-3 py-1 rounded-lg text-white
                        bg-red-500 hover:bg-red-600
                        shadow-[0_0_8px_rgba(255,80,80,0.45)]
                        hover:shadow-[0_0_12px_rgba(255,80,80,0.55)]
                        transition
                      "
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {banners.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-gray-600"
                  >
                    No banners found.
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
