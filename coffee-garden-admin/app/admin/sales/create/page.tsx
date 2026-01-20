"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saleCampaignService } from "@/services/saleCampaign.service";
import { productService } from "@/services/product.service";

/**
 * ===========================
 * SALE TYPES – ĐỒNG BỘ BE
 * ===========================
 */
type DiscountType = "percent" | "fixed_amount" | "fixed_price";

const ITEMS_PER_PAGE = 20;

export default function CreateSaleCampaignPage() {
  const router = useRouter();

  /* ================= STATE ================= */
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ================= DATE HELPERS ================= */
  const toBackendDateTime = (v: string) => (v ? v.replace("T", " ") + ":00" : v);

  /* ================= LOAD PRODUCTS ================= */
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await productService.all();
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* ================= FILTER =================
     CHỈ HIỂN THỊ SẢN PHẨM STOCK >= 1
  ========================================== */
  const filteredProducts = products.filter((p) => {
    const stock = Number(p?.stock ?? 0);
    const okStock = stock >= 1 || Boolean(p?.is_in_stock);

    const okSearch = (p?.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());

    return okStock && okSearch;
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ================= TOGGLE PRODUCT ================= */
  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ================= VALIDATE ================= */
  const validateForm = () => {
    if (!name.trim()) {
      setError("Tên chiến dịch không được để trống");
      return false;
    }

    if (!fromDate || !toDate) {
      setError("Vui lòng chọn thời gian");
      return false;
    }

    if (new Date(fromDate) >= new Date(toDate)) {
      setError("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    if (discountType === "percent" && (discountValue <= 0 || discountValue > 100)) {
      setError("Giảm % phải từ 1 – 100");
      return false;
    }

    if (
      (discountType === "fixed_amount" || discountType === "fixed_price") &&
      discountValue <= 0
    ) {
      setError("Giá trị phải lớn hơn 0");
      return false;
    }

    if (selectedProducts.length === 0) {
      setError("Vui lòng chọn ít nhất 1 sản phẩm");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    setError("");
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const campaign = await saleCampaignService.create({
        name,
        from_date: toBackendDateTime(fromDate),
        to_date: toBackendDateTime(toDate),
      });

      await saleCampaignService.attachProducts({
        campaignId: campaign.id,
        type: discountType,

        percent: discountType === "percent" ? discountValue : null,

        sale_price: discountType !== "percent" ? discountValue : null,

        productIds: selectedProducts,
      });

      router.push("/admin/sales");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tạo chiến dịch");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-semibold mb-6">Create Sale Campaign</h1>

      <div className="max-w-5xl p-8 rounded-2xl bg-white/40 border shadow-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-200 text-red-700 rounded">{error}</div>
        )}

        <div className="space-y-6">
          {/* NAME */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên chiến dịch"
            className="w-full px-4 py-3 rounded-lg border"
          />

          {/* DATE */}
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-3 rounded-lg border"
            />
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-3 rounded-lg border"
            />
          </div>

          {/* SALE TYPE */}
          <select
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value as DiscountType);
              setDiscountValue(0);
            }}
            className="w-full px-4 py-3 rounded-lg border"
          >
            <option value="percent">Giảm theo %</option>
            <option value="fixed_amount">Giảm tiền cố định</option>
            <option value="fixed_price">Đồng giá</option>
          </select>

          {/* SALE VALUE */}
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            placeholder={
              discountType === "percent"
                ? "Nhập % giảm"
                : discountType === "fixed_amount"
                ? "Nhập số tiền giảm"
                : "Nhập giá đồng"
            }
            className="w-full px-4 py-3 rounded-lg border"
          />

          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full px-4 py-2 rounded-lg border"
          />

          {/* PRODUCTS */}
          <div className="border rounded-lg p-4">
            {loadingProducts ? (
              <p>Đang tải…</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {paginatedProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 border p-3 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <img
                      src={p.thumbnail}
                      className="w-12 h-12 rounded object-cover"
                      alt={p.name}
                    />
                    <span>{p.name}</span>

                
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            {submitting ? "Đang tạo..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
