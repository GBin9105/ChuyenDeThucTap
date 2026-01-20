"use client";

import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { attributeService } from "@/services/attribute.service";
import { useRouter } from "next/navigation";

interface AttributeValue {
  id: number;
  name: string;
}

interface AttributeGroup {
  id: number;
  name: string;
  values?: AttributeValue[];
}

interface SelectedGroup {
  group_id: number;
  values: number[];
  active: number;
}

export default function CreateProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price_base: "",
    category_id: "",
    description: "",
    content: "",
    thumbnail: "",
    status: 1,
  });

  const [preview, setPreview] = useState<string>("");

  const [selectedValues, setSelectedValues] = useState<SelectedGroup[]>([]);

  // ===== GALLERY STATE =====
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState<string>("");
  const [galleryPreview, setGalleryPreview] = useState<string>("");

  /* ================================
   * LOAD DATA
   * ================================ */
  useEffect(() => {
    categoryService.all().then((res) => {
      const data = res?.data?.data ?? res?.data ?? [];
      setCategories(Array.isArray(data) ? data : []);
    });

    attributeService.all().then((items) => {
      setGroups(Array.isArray(items) ? items : []);
    });
  }, []);

  /* ================================
   * SLUG GENERATOR
   * ================================ */
  const generateSlug = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    const updated: any = { ...form, [name]: value };

    if (name === "name") updated.slug = generateSlug(value);
    if (name === "thumbnail") setPreview(value);

    setForm(updated);
  };

  /* ================================
   * ATTRIBUTE GROUP
   * ================================ */
  const toggleGroup = (group: AttributeGroup) => {
    const exists = selectedValues.find((g) => g.group_id === group.id);

    if (exists) {
      setSelectedValues((prev) =>
        prev.filter((g) => g.group_id !== group.id)
      );
    } else {
      setSelectedValues((prev) => [
        ...prev,
        { group_id: group.id, values: [], active: 1 },
      ]);
    }
  };

  const toggleValue = (group_id: number, value_id: number) => {
    setSelectedValues((prev) =>
      prev.map((g) => {
        if (g.group_id !== group_id) return g;

        const exists = g.values.includes(value_id);
        return {
          ...g,
          values: exists
            ? g.values.filter((v) => v !== value_id)
            : [...g.values, value_id],
        };
      })
    );
  };

  const toggleActive = (group_id: number) => {
    setSelectedValues((prev) =>
      prev.map((g) =>
        g.group_id === group_id
          ? { ...g, active: g.active ? 0 : 1 }
          : g
      )
    );
  };

  // ===== GALLERY HANDLERS =====
  const addGalleryImage = () => {
    if (!galleryInput.trim()) return;

    setGallery((prev) => [...prev, galleryInput.trim()]);
    setGalleryInput("");
    setGalleryPreview("");
  };

  const removeGalleryImage = (url: string) => {
    setGallery((prev) => prev.filter((img) => img !== url));
  };

  /* ================================
   * SUBMIT
   * ================================ */
  const handleSubmit = async () => {
    try {
      const attributesPayload = selectedValues.flatMap((group) =>
        group.values.map((value_id) => ({
          id: value_id,
          active: group.active,
        }))
      );

      const payload = {
        ...form,
        price_base: Number(form.price_base),
        category_id: Number(form.category_id),
        status: Number(form.status),
        attributes: attributesPayload,
      };

      const product = await productService.create(payload);

      // ===== CREATE GALLERY =====
      if (product?.id && gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
          await productService.addImage({
            product_id: product.id,
            image: gallery[i],
            is_main: i === 0,
            sort_order: i,
          });
        }
      }

      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      setError("Không thể tạo sản phẩm!");
    }
  };

  /* ================================
   * UI
   * ================================ */
  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl p-8 rounded-2xl bg-white/40 backdrop-blur-xl border border-gray-300 shadow-lg">
        <h2 className="text-2xl font-semibold text-black mb-6">
          Add Product
        </h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4 shadow">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* NAME */}
          <div>
            <label className="text-black font-medium">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="text-black font-medium">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />
          </div>

          {/* THUMBNAIL */}
          <div>
            <label className="text-black font-medium">Thumbnail URL</label>
            <input
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />

            {preview && (
              <img
                src={preview}
                className="mt-3 w-40 h-40 object-cover rounded-lg border shadow"
                onError={(e) => (e.currentTarget.src = "/no-image.png")}
              />
            )}
          </div>

          {/* ===== GALLERY ===== */}
          <div>
            <label className="text-black font-semibold">Gallery Images</label>

            <div className="flex gap-2 mt-2">
              <input
                value={galleryInput}
                onChange={(e) => {
                  setGalleryInput(e.target.value);
                  setGalleryPreview(e.target.value);
                }}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 rounded border bg-white/80"
              />

              <button
                type="button"
                onClick={addGalleryImage}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>

            {galleryPreview && (
              <img
                src={galleryPreview}
                className="mt-2 w-40 h-40 object-cover border rounded"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}

            <div className="grid grid-cols-4 gap-4 mt-4">
              {gallery.map((url, idx) => (
                <div key={idx} className="border rounded p-2">
                  <img
                    src={url}
                    className="w-full h-28 object-cover rounded"
                    onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
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
            <label className="text-black font-medium">Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
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
            <label className="text-black font-medium">Price Base</label>
            <input
              type="number"
              name="price_base"
              value={form.price_base}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-black font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />
          </div>

          {/* CONTENT */}
          <div>
            <label className="text-black font-medium">Content</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-white/80 border"
            />
          </div>

          {/* ATTRIBUTES */}
          <div>
            <label className="text-black font-semibold text-lg">
              Attributes
            </label>

            <div className="mt-4 space-y-4">
              {groups.map((group) => {
                const selectedGroup =
                  selectedValues.find((g) => g.group_id === group.id) || null;

                return (
                  <div key={group.id} className="p-4 rounded-xl bg-white/50 border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedGroup}
                        onChange={() => toggleGroup(group)}
                      />
                      <span className="text-lg font-semibold">
                        {group.name}
                      </span>
                    </label>

                    {selectedGroup && (
                      <div className="mt-3 ml-2 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {(group.values ?? []).map((value) => {
                            const isActive =
                              selectedGroup.values.includes(value.id);

                            return (
                              <span
                                key={value.id}
                                onClick={() =>
                                  toggleValue(group.id, value.id)
                                }
                                className={`px-3 py-1 text-sm rounded-full border cursor-pointer ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-800 border-gray-300"
                                }`}
                              >
                                {value.name}
                              </span>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => toggleActive(group.id)}
                          className={`px-4 py-1 rounded text-white ${
                            selectedGroup.active
                              ? "bg-green-600"
                              : "bg-gray-500"
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
            className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}
