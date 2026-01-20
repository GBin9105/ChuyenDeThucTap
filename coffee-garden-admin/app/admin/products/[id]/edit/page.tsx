"use client";

import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { attributeService } from "@/services/attribute.service";
import { useRouter, useParams } from "next/navigation";

/* =========================================
   TYPE DEFINITIONS (ADMIN PRODUCT DETAIL)
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
  value: AttributeValue | null;
  active: number; // 0 | 1
}

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  thumbnail?: string;

  price_base: number;

  description?: string;
  content?: string;

  category_id: number;
  status: number;

  attribute_values?: ProductAttributeItem[];
}

interface AttributeGroupWithValues {
  id: number;
  name: string;
  values?: AttributeValue[];
}

interface SelectedGroup {
  group_id: number;
  values: number[];
  active: number;
}

interface ProductForm {
  name: string;
  slug: string;
  thumbnail: string;
  price_base: number;
  description: string;
  content: string;
  category_id: number;
  status: number;
}

// ✅ (THÊM) TYPE GALLERY (không ảnh hưởng code cũ)
interface ProductImageItem {
  id: number;
  product_id: number;
  image: string;
  is_main?: boolean;
  sort_order?: number;
  status?: number;
}

/* =========================================
   COMPONENT
========================================= */

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<AttributeGroupWithValues[]>([]);
  const [selectedValues, setSelectedValues] = useState<SelectedGroup[]>([]);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  // ===== GALLERY STATE =====
  const [gallery, setGallery] = useState<ProductImageItem[]>([]);
  const [galleryInput, setGalleryInput] = useState("");
  const [galleryPreview, setGalleryPreview] = useState("");

  /* =========================================
     LOAD DATA
  ========================================= */

  useEffect(() => {
    async function loadData() {
      try {
        /* Categories */
        const catRes = await categoryService.all();
        const cats = catRes?.data?.data ?? catRes?.data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);

        /* Attribute groups */
        const attrRes = await attributeService.all();
        setGroups(Array.isArray(attrRes) ? attrRes : []);

        /* Product detail */
        const p = (await productService.get(productId)) as ProductDetail;
        if (!p) throw new Error("Product not found");

        setForm({
          name: p.name,
          slug: p.slug,
          thumbnail: p.thumbnail ?? "",
          price_base: Number(p.price_base),
          description: p.description ?? "",
          content: p.content ?? "",
          category_id: Number(p.category_id),
          status: Number(p.status ?? 1),
        });

        setPreview(p.thumbnail ?? "");

        try {
          const imgsRes: any = await productService.getImages(productId);
          const imgs =
            (Array.isArray(imgsRes) && imgsRes) ||
            (Array.isArray(imgsRes?.data) && imgsRes.data) ||
            (Array.isArray(imgsRes?.data?.data) && imgsRes.data.data) ||
            [];

          setGallery(imgs);
        } catch (e) {
          console.error(e);
          // không chặn edit page nếu gallery lỗi
          setGallery([]);
        }

        /* MAP ATTRIBUTE VALUES -> SELECTED GROUPS */
        if (Array.isArray(p.attribute_values)) {
          const groupMap: Record<number, SelectedGroup> = {};

          p.attribute_values.forEach((item) => {
            const value = item.value;
            if (!value || !value.group) return;

            const gid = value.group.id;

            if (!groupMap[gid]) {
              groupMap[gid] = {
                group_id: gid,
                values: [],
                active: item.active,
              };
            }

            groupMap[gid].values.push(value.id);
          });

          setSelectedValues(Object.values(groupMap));
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu sản phẩm!");
      }
    }

    if (productId) loadData();
  }, [productId]);

  if (!form) {
    return <div className="p-6 text-lg text-black">Loading...</div>;
  }

  /* =========================================
     SLUG GENERATOR
  ========================================= */

  const generateSlug = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    const updated = { ...form, [name]: value };

    if (name === "name") updated.slug = generateSlug(value);
    if (name === "thumbnail") setPreview(value);

    setForm(updated);
  };

  /* =========================================
     ATTRIBUTE LOGIC
  ========================================= */

  const toggleGroup = (group: AttributeGroupWithValues) => {
    const exists = selectedValues.find((g) => g.group_id === group.id);

    if (exists) {
      setSelectedValues((prev) => prev.filter((g) => g.group_id !== group.id));
    } else {
      setSelectedValues((prev) => [
        ...prev,
        { group_id: group.id, values: [], active: 1 },
      ]);
    }
  };

  const toggleValue = (group_id: number, value_id: number) => {
    setSelectedValues((prev) =>
      prev.map((g) =>
        g.group_id !== group_id
          ? g
          : {
            ...g,
            values: g.values.includes(value_id)
              ? g.values.filter((v) => v !== value_id)
              : [...g.values, value_id],
          }
      )
    );
  };

  const toggleActive = (group_id: number) => {
    setSelectedValues((prev) =>
      prev.map((g) =>
        g.group_id === group_id ? { ...g, active: g.active ? 0 : 1 } : g
      )
    );
  };

  /* =========================================
     ✅ GALLERY HANDLERS (THÊM GIỐNG CREATE)
  ========================================= */

  const addGalleryImage = async () => {
    try {
      const url = galleryInput.trim();
      if (!url) return;

      const newItem = await productService.addImage({
        product_id: productId,
        image: url,
        is_main: gallery.length === 0, // nếu chưa có ảnh nào -> set main
        sort_order: gallery.length,
      });

      // add vào list
      const createdRes: any = await productService.addImage({
        product_id: productId,
        image: url,
        is_main: gallery.length === 0,
        sort_order: gallery.length,
      });

      // store() bên BE trả: { status: true, data: image }
      const created =
        createdRes?.data?.data ?? createdRes?.data ?? createdRes;

      if (created) setGallery((prev) => [...prev, created]);

      // reset input + preview
      setGalleryInput("");
      setGalleryPreview("");
    } catch (err) {
      console.error(err);
      setError("Không thể thêm ảnh gallery!");
    }
  };

  const removeGalleryImage = async (img: ProductImageItem) => {
    try {
      await productService.deleteImage(img.id);
      setGallery((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      console.error(err);
      setError("Không thể xoá ảnh gallery!");
    }
  };

  /* =========================================
     SUBMIT UPDATE
  ========================================= */

  const handleSubmit = async () => {
    try {
      const attributesPayload = selectedValues.flatMap((group) =>
        group.values.map((value_id) => ({
          id: value_id,
          active: group.active,
        }))
      );

      await productService.update(productId, {
        ...form,
        price_base: Number(form.price_base),
        category_id: Number(form.category_id),
        status: Number(form.status),
        attributes: attributesPayload,
      });

      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      setError("Lỗi khi cập nhật sản phẩm!");
    }
  };

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl p-8 rounded-2xl bg-white/40 border shadow-xl backdrop-blur-lg">
        <h2 className="text-2xl font-semibold text-black mb-6">Edit Product</h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* NAME */}
          <div>
            <label className="font-medium">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="font-medium">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />
          </div>

          {/* THUMBNAIL */}
          <div>
            <label className="font-medium">Thumbnail URL</label>
            <input
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />

            {preview && (
              <img
                src={preview}
                className="mt-3 w-40 h-40 object-cover border rounded-lg"
                onError={(e) => (e.currentTarget.src = "/no-image.png")}
              />
            )}
          </div>

          {/* ✅ GALLERY (THÊM GIỐNG CREATE) */}
          <div>
            <label className="font-semibold">Gallery Images</label>

            <div className="flex gap-2 mt-2">
              <input
                value={galleryInput}
                onChange={(e) => {
                  setGalleryInput(e.target.value);
                  setGalleryPreview(e.target.value); // ✅ preview ngay khi nhập
                }}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 rounded border bg-white"
              />

              <button
                type="button"
                onClick={addGalleryImage}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>

            {/* PREVIEW ẢNH ĐANG NHẬP */}
            {galleryPreview && (
              <img
                src={galleryPreview}
                className="mt-2 w-40 h-40 object-cover border rounded"
                onError={(e) => {
                  // nếu URL sai -> ẩn preview
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            {/* LIST GALLERY */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {gallery.map((img, idx) => (
                <div key={img.id ?? idx} className="border rounded p-2 bg-white">
                  <img
                    src={img.image}
                    className="w-full h-28 object-cover rounded"
                    onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(img)}
                    className="text-xs text-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="font-medium">Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* PRICE */}
          <div>
            <label className="font-medium">Price Base</label>
            <input
              type="number"
              name="price_base"
              value={form.price_base}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />
          </div>

          {/* CONTENT */}
          <div>
            <label className="font-medium">Content</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 bg-white border rounded-lg"
            />
          </div>

          {/* ATTRIBUTES */}
          <div>
            <label className="font-semibold text-lg">Attributes</label>

            <div className="mt-4 space-y-4">
              {groups.map((group) => {
                const selectedGroup = selectedValues.find(
                  (g) => g.group_id === group.id
                );

                return (
                  <div
                    key={group.id}
                    className="p-4 bg-white/60 border rounded-xl"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedGroup}
                        onChange={() => toggleGroup(group)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <span className="font-semibold">{group.name}</span>
                    </label>

                    {selectedGroup && (
                      <div className="mt-3 ml-2 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {group.values?.map((value) => {
                            const isSelected =
                              selectedGroup.values.includes(value.id);

                            return (
                              <span
                                key={value.id}
                                onClick={() => toggleValue(group.id, value.id)}
                                className={`px-3 py-1 text-sm rounded-full border cursor-pointer ${isSelected
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white border-gray-300"
                                  }`}
                              >
                                {value.name}
                              </span>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => toggleActive(group.id)}
                          className={`px-4 py-1 rounded text-white ${selectedGroup.active ? "bg-green-600" : "bg-gray-500"
                            }`}
                        >
                          {selectedGroup.active ? "Active" : "Hidden"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700"
          >
            Update Product
          </button>
        </div>
      </div>
    </div>
  );
}
