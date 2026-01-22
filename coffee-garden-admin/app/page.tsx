"use client";

import { useEffect, useState } from "react";

import BannerSlider from "./(client)/components/BannerSlider";
import CategoryMenu from "./(client)/components/CategoryMenu";
import ProductCard from "./(client)/components/ProductCard";
import Navbar from "./(client)/components/Navbar";
import Footer from "./(client)/components/Footer";

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /* ============================================================
     FETCH CATEGORIES
  ============================================================ */
  useEffect(() => {
    fetch("http://localhost:8000/api/categories", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setCategories(list);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategory(false));
  }, []);

  /* ============================================================
     FETCH FEATURED PRODUCTS (4 items)
  ============================================================ */
  useEffect(() => {
    fetch("http://localhost:8000/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setProducts(list.slice(0, 4));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  /* ============================================================
     UI
  ============================================================ */
  return (
    <>
      {/* ===== NAVBAR ===== */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* ===== BANNER ===== */}
        <BannerSlider />

        {/* ================= CATEGORIES ================= */}
        <h2 className="mt-14 mb-6 w-full flex justify-center">
          <span className="shine-title">
            MUA SẮM THEO DANH MỤC
          </span>
        </h2>

        {loadingCategory ? (
          <div className="mt-6 text-gray-500 text-center">
            Loading categories...
          </div>
        ) : (
          <CategoryMenu
            categories={categories}
            mode="navigate"   
          />
        )}

        {/* ================= FEATURED PRODUCTS ================= */}
        <h2 className="mt-16 mb-6 w-full flex justify-center">
          <span className="shine-title">
            SẢN PHẨM MỚI
          </span>
        </h2>

        {loadingProducts ? (
          <div className="mt-6 text-gray-500 text-center">
            Loading products...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />
    </>
  );
}
