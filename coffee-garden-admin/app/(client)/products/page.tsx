"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import CategoryMenu from "../components/CategoryMenu";

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== CATEGORY FILTER =====
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // ===== PAGINATION =====
  const [page, setPage] = useState(1);
  const perPage = 8;

  /* ============================================================
     READ CATEGORY FROM URL (?category=ID)
  ============================================================ */
  useEffect(() => {
    const categoryParam = searchParams.get("category");

    if (categoryParam && !isNaN(Number(categoryParam))) {
      setSelectedCategory(Number(categoryParam));
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams]);

  /* ============================================================
     LOAD PRODUCTS
  ============================================================ */
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:8000/api/products", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Network error");

      const json = await res.json();

      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setProducts(list);
      setPage(1);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError("Không thể tải danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD CATEGORIES
  ============================================================ */
  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/categories", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const json = await res.json();

      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setCategories(list);
    } catch (err) {
      console.error("LOAD CATEGORIES ERROR:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  /* ============================================================
     FILTER PRODUCTS
  ============================================================ */
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === null) return true;
    return p.category_id === selectedCategory;
  });

  /* ============================================================
     PAGINATION
  ============================================================ */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const goToPage = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* ===== TITLE ===== */}
        <h1 className="w-full flex justify-center">
          <span className="shine-title">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name ??
                "SẢN PHẨM"
              : "TẤT CẢ SẢN PHẨM"}
          </span>
        </h1>

        {/* ===== CATEGORY MENU ===== */}
        <CategoryMenu
          categories={categories}
          activeId={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            setPage(1);
          }}
        />

        {/* ===== CONTENT ===== */}
        {loading ? (
          <p className="mt-6 text-gray-500 text-center">Loading...</p>
        ) : error ? (
          <p className="mt-6 text-red-500 text-center">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-6 text-gray-500 text-center">
            Không có sản phẩm nào trong danh mục này
          </p>
        ) : (
          <>
            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
              {paginatedData.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? "px-5 py-2 rounded-xl font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "px-5 py-2 rounded-xl font-semibold bg-white/70 backdrop-blur-xl border border-gray-300 text-gray-700 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/30 transition-all"
                }
              >
                ← Prev
              </button>

              <span className="px-5 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-300 text-gray-800 font-semibold shadow">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  goToPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? "px-5 py-2 rounded-xl font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "px-5 py-2 rounded-xl font-semibold bg-white/70 backdrop-blur-xl border border-gray-300 text-gray-700 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/30 transition-all"
                }
              >
                Next →
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
