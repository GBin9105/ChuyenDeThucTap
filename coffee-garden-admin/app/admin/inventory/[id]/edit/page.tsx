"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productService } from "@/services/product.service";
import {
  inventoryService,
  InventoryItem,
} from "@/services/inventory.service";

export default function InventoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<any>(null);
  const [inventory, setInventory] =
    useState<InventoryItem | null>(null);

  /* ================= INVENTORY STATE ================= */
  const [stock, setStock] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      /* 1️⃣ Load product (CHỈ DÙNG HIỂN THỊ) */
      const prod = await productService.get(productId);
      if (!prod?.id) {
        throw new Error("Product not found");
      }
      setProduct(prod);

      /* 2️⃣ Load inventory snapshot (QUAN TRỌNG) */
      const inv = await inventoryService.getByProduct(productId);

      setInventory(inv);
      setStock(inv?.stock ?? 0);
      setCostPrice(Number(inv?.cost_price ?? 0));
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(productId)) {
      loadData();
    }
  }, [productId]);

  /* ================= SAVE INVENTORY ================= */
  const handleSave = async () => {
    setError("");

    if (stock < 0) {
      setError("Số lượng tồn kho không hợp lệ");
      return;
    }

    if (costPrice < 0) {
      setError("Giá nhập không hợp lệ");
      return;
    }

    try {
      setSaving(true);

      await inventoryService.adjust({
        product_id: productId,
        qty: stock,
        price_root: costPrice,
      });

      router.push("/admin/inventory");
    } catch (err) {
      console.error(err);
      setError("Cập nhật tồn kho thất bại");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="p-6 text-black">
        Đang tải dữ liệu…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-red-600">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-semibold mb-6">
        Chỉnh sửa tồn kho
      </h1>

      <div className="max-w-3xl bg-white rounded-2xl p-6 shadow space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* PRODUCT INFO */}
        <div className="flex gap-4 items-center">
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-20 h-20 rounded object-cover"
          />
          <div>
            <p className="font-semibold text-lg">
              {product.name}
            </p>
            <p className="text-sm text-gray-500">
              Giá bán:{" "}
              {Number(product.price_base).toLocaleString()}đ
            </p>
          </div>
        </div>

        {/* COST PRICE */}
        <div>
          <label className="block font-medium mb-1">
            Giá nhập (VNĐ)
          </label>
          <input
            type="number"
            min={0}
            value={costPrice}
            onChange={(e) =>
              setCostPrice(Number(e.target.value))
            }
            className="w-full px-4 py-3 rounded-lg border bg-white"
          />
        </div>

        {/* STOCK */}
        <div>
          <label className="block font-medium mb-1">
            Số lượng tồn kho
          </label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) =>
              setStock(Number(e.target.value))
            }
            className="w-full px-4 py-3 rounded-lg border bg-white"
          />
        </div>

        {/* STATUS */}
        <div className="flex gap-3 items-center">
          {stock > 0 ? (
            <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">
              Còn hàng
            </span>
          ) : (
            <span className="px-3 py-1 text-sm rounded bg-red-100 text-red-700">
              Hết hàng
            </span>
          )}

          {costPrice > 0 && (
            <span className="text-sm text-gray-500">
              Lợi nhuận ước tính:{" "}
              {(product.price_base - costPrice).toLocaleString()}đ
            </span>
          )}
        </div>

        {/* ACTION */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg border"
          >
            Quay lại
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu tồn kho"}
          </button>
        </div>
      </div>
    </div>
  );
}
