"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { productService, ProductItem, ProductImage } from "@/services/product.service";

/* =========================================
   TYPE DEFINITIONS
========================================= */
interface AttributeGroup {
  id: number;
  name: string;
}

interface AttributeValue {
  id: number;
  name: string;
  group?: AttributeGroup | null;
}

interface ProductAttributeItem {
  id: number;
  active: boolean;
  value: AttributeValue | null;
}

interface ProductListItem extends ProductItem {
  attribute_values?: ProductAttributeItem[];
  description?: string;
  final_price?: number;
}

/* =========================================
   COMPONENT
========================================= */
export default function ProductListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* SEARCH */
  const [search, setSearch] = useState("");

  // ===== MODAL STATE (GALLERY VIEWER) =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // 1) Lấy danh sách product
      const res = await productService.all();
      const productsArr: ProductListItem[] = Array.isArray(res) ? (res as any) : [];

      // 2) Lấy gallery cho từng product (N calls)
      //    Nếu product nhiều quá, nên tạo endpoint BE trả sẵn images trong /admin/products để tối ưu.
      const imagesResults = await Promise.all(
        productsArr.map(async (p) => {
          try {
            const imgs = await productService.getImages(p.id);
            // đảm bảo sort theo sort_order nếu có
            const sorted = (Array.isArray(imgs) ? imgs : []).slice().sort((a, b) => {
              const ao = Number(a.sort_order ?? 0);
              const bo = Number(b.sort_order ?? 0);
              return ao - bo;
            });
            return { productId: p.id, images: sorted };
          } catch (e) {
            console.error("LOAD IMAGES ERROR productId=", p.id, e);
            return { productId: p.id, images: [] as ProductImage[] };
          }
        })
      );

      const imageMap = new Map<number, ProductImage[]>();
      imagesResults.forEach((x) => imageMap.set(x.productId, x.images));

      // 3) Merge images vào products
      const merged = productsArr.map((p) => ({
        ...p,
        images: imageMap.get(p.id) ?? [],
      }));

      setProducts(merged);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      await productService.delete(id);
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa sản phẩm!");
    }
  };

  /* =========================================
     BUILD GROUP -> VALUE MAP
  ========================================= */
  const buildGroupMap = (attrs: ProductAttributeItem[]) => {
    const map: Record<string, string[]> = {};

    attrs.forEach((attr) => {
      const v = attr.value;
      if (!v || !v.group) return;

      const g = v.group.name;
      if (!map[g]) map[g] = [];
      map[g].push(v.name);
    });

    return map;
  };

  /* =========================================
     GALLERY HELPERS
  ========================================= */
  const getGalleryUrls = (item: ProductListItem): string[] => {
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images
        .map((x) => x?.image)
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    }
    return [];
  };

  const openGalleryModal = (item: ProductListItem, startIndex = 0) => {
    const urls = getGalleryUrls(item);
    if (urls.length === 0) return;

    setModalTitle(item.name);
    setModalImages(urls);
    setModalIndex(Math.min(Math.max(startIndex, 0), urls.length - 1));
    setIsModalOpen(true);
  };

  const closeGalleryModal = () => {
    setIsModalOpen(false);
    setModalTitle("");
    setModalImages([]);
    setModalIndex(0);
  };

  const prevImage = () => {
    setModalIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
  };

  const nextImage = () => {
    setModalIndex((prev) => (prev + 1) % modalImages.length);
  };

  /* =========================================
     FILTER (useMemo để không bị Hooks lỗi)
  ========================================= */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  if (loading) return <div className="p-6 text-lg text-black">Loading...</div>;

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-black">Products</h1>

          <Link
            href="/admin/products/create"
            className="
              px-5 py-2.5 rounded-lg text-white font-medium
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_15px_rgba(90,120,255,0.4)]
              transition
            "
          >
            + Add Product
          </Link>
        </div>

        {/* SEARCH */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full max-w-md px-4 py-2.5
              rounded-xl text-sm
              bg-white/70 backdrop-blur-md
              border border-gray-300
              focus:outline-none focus:ring-2
              focus:ring-blue-400
              shadow
            "
          />
        </div>

        {/* TABLE */}
        <div
          className="
            overflow-x-auto rounded-xl
            bg-white/70 backdrop-blur-md
            border border-gray-300 shadow-md
            scrollbar-hide
          "
        >
          <table className="min-w-[1650px] w-full text-sm text-black">
            <thead className="bg-white/80 border-b border-gray-300">
              <tr className="text-center font-semibold">
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Image</th>
                <th className="p-3 border">Gallery</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Description</th>
                <th className="p-3 border">Category</th>
                <th className="p-3 border">Base Price</th>
                <th className="p-3 border">Final Price</th>
                <th className="p-3 border">Group</th>
                <th className="p-3 border">Value</th>
                <th className="p-3 border w-[200px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((item) => {
                const thumb = item.thumbnail || "/no-image.png";
                const attrs = item.attribute_values ?? [];

                const groupMap = buildGroupMap(attrs);
                const groupNames = Object.keys(groupMap);

                const galleryUrls = getGalleryUrls(item);
                const stack = galleryUrls.slice(0, 3);

                return (
                  <tr key={item.id} className="hover:bg-white/50 transition border-b">
                    <td className="p-3 border text-center">{item.id}</td>

                    <td className="p-3 border text-center">
                      <img
                        src={thumb}
                        className="w-14 h-14 object-cover rounded border shadow"
                        alt={item.name}
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                    </td>

                    {/* ===== GALLERY COLUMN ===== */}
                    <td className="p-3 border text-center">
                      {stack.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openGalleryModal(item, 0)}
                          className="relative w-[76px] h-[56px] mx-auto"
                          title="Click to view gallery"
                        >
                          {stack.map((url, idx) => {
                            const offsets = [
                              { left: 0, rotate: -8, z: 10 },
                              { left: 14, rotate: 0, z: 20 },
                              { left: 28, rotate: 8, z: 30 },
                            ];
                            const o = offsets[idx] ?? offsets[0];

                            return (
                              <img
                                key={url + idx}
                                src={url}
                                alt={`gallery-${idx}`}
                                className="absolute top-0 w-12 h-12 object-cover rounded border shadow bg-white"
                                style={{
                                  left: `${o.left}px`,
                                  transform: `rotate(${o.rotate}deg)`,
                                  zIndex: o.z,
                                }}
                                onError={(e) => (e.currentTarget.src = "/no-image.png")}
                              />
                            );
                          })}

                          {galleryUrls.length > 3 && (
                            <div className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-black/70 text-white">
                              +{galleryUrls.length - 3}
                            </div>
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="p-3 border">{item.name}</td>

                    <td className="p-3 border max-w-[240px] truncate">
                      {(item as any).description || "—"}
                    </td>

                    <td className="p-3 border text-center">{item.category?.name ?? "—"}</td>

                    <td className="p-3 border text-center">
                      {Number(item.price_base ?? 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td className="p-3 border text-center font-semibold">
                      {Number((item as any).final_price ?? 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td className="p-3 border align-top">
                      <div className="flex flex-col gap-2">
                        {groupNames.length > 0 ? (
                          groupNames.map((g) => (
                            <div
                              key={g}
                              className="px-2 py-1 text-xs font-semibold bg-blue-100 border border-blue-300 rounded"
                            >
                              {g}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border align-top">
                      <div className="flex flex-col gap-4">
                        {groupNames.length > 0 ? (
                          groupNames.map((g) => (
                            <div key={g}>
                              <div className="text-xs font-semibold text-gray-700 underline">{g}</div>

                              <div className="flex flex-col gap-1 mt-1">
                                {groupMap[g].map((v) => (
                                  <span
                                    key={v}
                                    className="px-2 py-1 text-xs rounded bg-gray-200 border border-gray-300"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border text-center space-x-2">
                      <Link
                        href={`/admin/products/${item.id}/edit`}
                        className="
                          px-3 py-1.5 rounded-lg text-white
                          bg-yellow-500 hover:bg-yellow-600
                          shadow-[0_0_12px_rgba(255,200,80,0.45)]
                          transition
                        "
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="
                          px-3 py-1.5 rounded-lg text-white
                          bg-red-500 hover:bg-red-600
                          shadow-[0_0_12px_rgba(255,100,100,0.45)]
                          transition
                        "
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-4 text-center text-gray-600 italic">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL GALLERY VIEWER ===== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
          onClick={closeGalleryModal}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-semibold text-black truncate">{modalTitle}</div>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                onClick={closeGalleryModal}
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {modalImages.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={prevImage}
                    >
                      Prev
                    </button>

                    <div className="flex-1 flex justify-center">
                      <img
                        src={modalImages[modalIndex]}
                        alt={`modal-${modalIndex}`}
                        className="max-h-[420px] w-auto object-contain rounded border bg-white"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                    </div>

                    <button
                      className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={nextImage}
                    >
                      Next
                    </button>
                  </div>

                  {/* Thumbnails */}
                  <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {modalImages.map((url, idx) => (
                      <button
                        key={url + idx}
                        type="button"
                        onClick={() => setModalIndex(idx)}
                        className={`border rounded p-1 bg-white ${
                          idx === modalIndex ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                        }`}
                        title={`Image ${idx + 1}`}
                      >
                        <img
                          src={url}
                          className="w-16 h-16 object-cover rounded"
                          alt={`thumb-${idx}`}
                          onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {modalIndex + 1} / {modalImages.length}
                  </div>
                </>
              ) : (
                <div className="text-gray-600">No images</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
