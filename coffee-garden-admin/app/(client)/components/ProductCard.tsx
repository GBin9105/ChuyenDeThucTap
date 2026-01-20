"use client";

import Link from "next/link";

type Product = {
  id: number;
  name: string;
  slug: string;
  thumbnail?: string | null;
  price_base: number;
  final_price: number;
  is_on_sale: boolean;
  description?: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  const image =
    product.thumbnail && product.thumbnail !== ""
      ? product.thumbnail
      : "https://via.placeholder.com/300x300?text=No+Image";

  const basePrice = Number(product.price_base) || 0;
  const finalPrice =
    Number(product.final_price) > 0
      ? Number(product.final_price)
      : basePrice;

  /* ---------------------------------------------
     CALCULATE DISCOUNT (SAFE)
  --------------------------------------------- */
  let discountPercent: number | null = null;

  if (
    product.is_on_sale &&
    basePrice > 0 &&
    finalPrice > 0 &&
    finalPrice < basePrice
  ) {
    discountPercent = Math.round(
      ((basePrice - finalPrice) / basePrice) * 100
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="
        block rounded-2xl overflow-hidden 
        bg-white/70 backdrop-blur-xl 
        border border-white/60
        shadow-[0_6px_20px_rgba(0,0,0,0.08)]
        hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)]
        transition-all duration-300 hover:-translate-y-1
      "
    >
      {/* IMAGE */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={product.name}
          className="
            w-full h-full object-cover
            transition-transform duration-700
            hover:scale-110
          "
        />

        {/* SALE BADGE */}
        {discountPercent !== null && discountPercent > 0 && (
          <span
            className="
              absolute top-2 left-2
              bg-gradient-to-r from-red-600 to-red-500
              text-white text-xs font-bold tracking-wide
              px-2.5 py-1 rounded-lg shadow-lg
            "
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="product-name">{product.name}</h3>

        {product.description && (
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-end gap-2">
          {/* FINAL PRICE */}
          <p className="text-lg font-bold text-green-600 drop-shadow-sm">
            {finalPrice.toLocaleString()}₫
          </p>

          {/* OLD PRICE */}
          {discountPercent !== null && discountPercent > 0 && (
            <span className="text-gray-500 text-sm line-through">
              {basePrice.toLocaleString()}₫
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
