"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { saleCampaignService } from "@/services/saleCampaign.service";
import { productService } from "@/services/product.service";

/**
 * ===========================
 * SALE TYPES – ĐỒNG BỘ BE
 * ===========================
 */
type DiscountType =
  | "percent"
  | "fixed_amount"
  | "fixed_price";

const ITEMS_PER_PAGE = 20;

export default function EditSaleCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Number(params.id);

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [discountType, setDiscountType] =
    useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState("");

  /* ================= DATE HELPERS ================= */

  const toInputDateTime = (v?: string) =>
    v ? v.replace(" ", "T").slice(0, 16) : "";

  const toBackendDateTime = (v: string) =>
    v ? v.replace("T", " ") + ":00" : v;

  /* ================= LOAD CAMPAIGN ================= */

  const loadCampaign = async () => {
    const campaign = await saleCampaignService.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    setName(campaign.name);
    setFromDate(toInputDateTime(campaign.from_date));
    setToDate(toInputDateTime(campaign.to_date));

    const firstItem = campaign.items?.[0];
    if (!firstItem) throw new Error("Campaign has no items");

    // 🔥 TIN 100% VÀO TYPE TỪ BE
    const realType: DiscountType = firstItem.type;

    setDiscountType(realType);

    setDiscountValue(
      realType === "percent"
        ? Number(firstItem.percent ?? 0)
        : Number(firstItem.sale_price ?? 0)
    );

    setSelectedProducts(
      campaign.items.map((i: any) => i.product_id)
    );
  };

  /* ================= LOAD PRODUCTS ================= */

  const loadProducts = async () => {
    const res = await productService.all();
    setProducts(Array.isArray(res) ? res : []);
  };

  useEffect(() => {
    if (isNaN(campaignId)) return;

    (async () => {
      try {
        setLoading(true);
        await loadCampaign();
        await loadProducts();
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu chiến dịch");
      } finally {
        setLoading(false);
        setLoadingProducts(false);
      }
    })();
  }, [campaignId]);

  /* ================= FILTER + SORT ================= */

  const processedProducts = useMemo(() => {
    const lower = search.toLowerCase();

    const filtered = products.filter((p) =>
      p.name?.toLowerCase().includes(lower)
    );

    // selected lên trên
    return filtered.sort((a, b) => {
      const aSelected = selectedProducts.includes(a.id);
      const bSelected = selectedProducts.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [products, selectedProducts, search]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(
    processedProducts.length / ITEMS_PER_PAGE
  );

  const paginatedProducts = processedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ================= TOGGLE PRODUCT ================= */

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
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

    if (
      discountType === "percent" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      setError("Giảm % phải từ 1 – 100");
      return false;
    }

    if (
      (discountType === "fixed_amount" ||
        discountType === "fixed_price") &&
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

  /* ================= SAVE ================= */

  const handleSave = async () => {
    setError("");
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 1. UPDATE INFO + TIME
      await saleCampaignService.update(campaignId, {
        name,
        from_date: toBackendDateTime(fromDate),
        to_date: toBackendDateTime(toDate),
      });

      // 2. UPDATE PRODUCTS + SALE RULE
      await saleCampaignService.attachProducts({
        campaignId,
        type: discountType,

        percent:
          discountType === "percent"
            ? discountValue
            : null,

        sale_price:
          discountType !== "percent"
            ? discountValue
            : null,

        productIds: selectedProducts,
      });

      router.push("/admin/sales");
    } catch (err) {
      console.error(err);
      setError("Không thể lưu chiến dịch");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <div className="p-6 text-black">Loading...</div>;
  }

  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-semibold mb-6">
        Edit Sale Campaign
      </h1>

      <div className="max-w-5xl p-8 rounded-2xl bg-white/40 border shadow-xl">
        {error && (
          <div className="mb-4 p-3 bg-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* NAME */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              setDiscountType(
                e.target.value as DiscountType
              );
              setDiscountValue(0);
            }}
            className="w-full px-4 py-3 rounded-lg border"
          >
            <option value="percent">Giảm theo %</option>
            <option value="fixed_amount">
              Giảm tiền cố định
            </option>
            <option value="fixed_price">
              Đồng giá
            </option>
          </select>

          {/* SALE VALUE */}
          <input
            type="number"
            value={discountValue}
            onChange={(e) =>
              setDiscountValue(Number(e.target.value))
            }
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
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SAVE */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            {saving ? "Đang lưu..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
