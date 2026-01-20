"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { cartService } from "@/services/cart.service";

/* =====================================================
   TYPES
===================================================== */
type AttributeValueItem = {
  id: number;
  name: string;
  price_extra: number;
  group_id?: number | null;
  group_name?: string | null;
};

type AttributeGroupMap = Record<string, AttributeValueItem[]>;

type ProductImageItem = {
  id?: number;
  product_id?: number;
  image: string;
  is_main?: boolean;
  sort_order?: number;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
};

type GalleryMainImage = ProductImageItem | null;

interface ProductItem {
  id: number;
  slug: string;
  name: string;
  thumbnail?: string | null;
  category_id?: number;

  price_base: number;
  final_price: number;
  is_on_sale: boolean;

  stock?: number;
  is_in_stock?: boolean;

  description?: string | null;
  content?: string | null;

  images?: ProductImageItem[];
  gallery_main_image?: GalleryMainImage;

  gallery?: string[];
  product_images?: ProductImageItem[];

  attribute_values?: {
    id: number;
    active: number;
    value: {
      id: number;
      name: string;
      price_extra: number;
      group: { id: number; name: string } | null;
    } | null;
  }[];

  attributes_grouped?: AttributeGroupMap;
}

type SizeItem = {
  id: number;
  name: string;
  price_extra: number;
};

type GalleryItem = {
  key: string;
  url: string;
  id?: number;
  isMain?: boolean;
};

/* =====================================================
   CONFIG
===================================================== */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000/api";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || "http://localhost:8000";

/* =====================================================
   HELPERS
===================================================== */
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json();
}

function clampIndex(idx: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(idx, 0), length - 1);
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeString(u?: string | null) {
  return String(u ?? "").trim();
}

function resolveUrl(u?: string | null) {
  const s = normalizeString(u);
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return "https:" + s;
  if (s.startsWith("/")) return BACKEND_BASE.replace(/\/+$/, "") + s;
  return s;
}

function pickApiArray(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function pickProductsArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data?.data?.data)) return data.data.data.data;
  return [];
}

// Fisher–Yates shuffle (ổn định & chuẩn hơn)
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function currencyVND(v: any) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return String(v ?? "0");
  return n.toLocaleString("vi-VN") + " ₫";
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/* =====================================================
   PAGE
===================================================== */
export default function ProductSlugClientPage() {
  const params = useParams();
  const router = useRouter();

  const LOGIN_PATH = "/account/login";

  const slugParam = (params as any)?.slug;
  const slug: string = Array.isArray(slugParam)
    ? slugParam[0]
    : (slugParam as string);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [related, setRelated] = useState<ProductItem[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<SizeItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedValues, setSelectedValues] = useState<
    Record<string, AttributeValueItem[]>
  >({});

  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalDirty, setModalDirty] = useState(false);

  const [adding, setAdding] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const goLogin = () => {
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";
    router.push(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    setIsAuthed(!!getToken());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        setIsAuthed(!!getToken());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* =====================================================
     GROUP ATTRIBUTES
  ====================================================== */
  const buildGrouped = (
    arr?: ProductItem["attribute_values"]
  ): AttributeGroupMap => {
    const map: AttributeGroupMap = {};
    if (!Array.isArray(arr)) return map;

    for (const item of arr) {
      if (!item?.value?.id) continue;
      if (!item?.value?.group?.name) continue;

      const groupName = String(item.value.group.name);
      const value: AttributeValueItem = {
        id: item.value.id,
        name: String(item.value.name ?? ""),
        price_extra: toNumber(item.value.price_extra, 0),
        group_id: item.value.group?.id ?? null,
        group_name: groupName,
      };

      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(value);
    }

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const pa = toNumber(a.price_extra, 0);
        const pb = toNumber(b.price_extra, 0);
        if (pa !== pb) return pa - pb;
        return String(a.name).localeCompare(String(b.name));
      });
    });

    return map;
  };

  /* =====================================================
     FETCH PRODUCT + SIZES + RELATED (RANDOM)
  ====================================================== */
  const fetchProduct = async () => {
    try {
      setLoading(true);

      const data = await fetchJson(
        `${API_BASE}/products/${encodeURIComponent(slug)}`
      );

      if (!data || !data.id) {
        setProduct(null);
        setRelated([]);
        setSizes([]);
        setSelectedSize(null);
        setSelectedValues({});
        setDisplayIndex(null);
        return;
      }

      const grouped = buildGrouped(data.attribute_values);

      const productObj: ProductItem = {
        ...data,
        attributes_grouped: grouped,
        images: Array.isArray(data?.images) ? data.images : [],
        product_images: Array.isArray(data?.product_images)
          ? data.product_images
          : [],
        gallery_main_image: data?.gallery_main_image ?? null,
      };

      setProduct(productObj);
      setSelectedValues({});
      setDisplayIndex(null);

      // ===== SIZES (legacy) =====
      try {
        const sizeJson = await fetchJson(
          `${API_BASE}/products/${data.id}/sizes`
        );
        const raw = pickApiArray(sizeJson);

        const mapped: SizeItem[] = raw
          .map((s: any) => ({
            id: toNumber(s?.id, 0),
            name: String(s?.name ?? s?.size_name ?? s?.title ?? "").trim(),
            price_extra: toNumber(
              s?.price_extra ?? s?.pivot?.price_extra ?? 0,
              0
            ),
          }))
          .filter((s: SizeItem) => s.id > 0 && s.name);

        setSizes(mapped);
        setSelectedSize(null);
      } catch {
        setSizes([]);
        setSelectedSize(null);
      }

      // ✅ ===== RELATED (same category) - RANDOM =====
      try {
        if (data.category_id) {
          const listJson = await fetchJson(
            `${API_BASE}/products?category=${data.category_id}`
          );
          const list = pickProductsArray(listJson) as ProductItem[];

          const filtered = Array.isArray(list)
            ? list.filter(
                (p) =>
                  p &&
                  p.id &&
                  p.slug &&
                  p.id !== data.id &&
                  p.slug !== slug
              )
            : [];

          // random 4 sản phẩm liên quan (mỗi lần load detail sẽ khác)
          const picked = shuffle(filtered).slice(0, 4);
          setRelated(picked);
        } else {
          setRelated([]);
        }
      } catch {
        setRelated([]);
      }
    } catch (err) {
      console.error("Fetch product error:", err);
      setProduct(null);
      setRelated([]);
      setSizes([]);
      setSelectedSize(null);
      setSelectedValues({});
      setDisplayIndex(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* =====================================================
     GALLERY ITEMS
  ====================================================== */
  const galleryItems: GalleryItem[] = useMemo(() => {
    if (!product) return [];

    const items: GalleryItem[] = [];
    const mainId = product.gallery_main_image?.id;

    const pushItem = (img: ProductImageItem, prefix: string, idx: number) => {
      const url = resolveUrl(img?.image);
      if (!url) return;
      items.push({
        key: `${prefix}-${img?.id ?? "noid"}-${idx}`,
        url,
        id: img?.id,
        isMain: !!img?.is_main,
      });
    };

    if (product.gallery_main_image?.image) {
      pushItem(product.gallery_main_image, "main", 0);
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        if (mainId && img?.id === mainId) return;
        if (img?.status === false) return;
        pushItem(img, "img", idx);
      });
    }

    if (
      Array.isArray(product.product_images) &&
      product.product_images.length > 0
    ) {
      product.product_images.forEach((img, idx) => {
        if (mainId && img?.id === mainId) return;
        if (img?.status === false) return;
        pushItem(img, "pimg", idx);
      });
    }

    if (Array.isArray(product.gallery) && product.gallery.length) {
      product.gallery.forEach((u, idx) => {
        const url = resolveUrl(u);
        if (!url) return;
        items.push({ key: `url-${idx}-${url}`, url });
      });
    }

    if (items.length === 0) {
      const thumb = resolveUrl(product.thumbnail);
      if (thumb) items.push({ key: `thumb-${thumb}`, url: thumb });
    }

    return items;
  }, [product]);

  /* =====================================================
     PRIMARY PRODUCT IMAGE
  ====================================================== */
  const productMainUrl = useMemo(() => {
    const thumb = resolveUrl(product?.thumbnail);
    if (thumb) return thumb;

    const gm = resolveUrl(product?.gallery_main_image?.image);
    if (gm) return gm;

    const first = resolveUrl(galleryItems[0]?.url);
    if (first) return first;

    return "/no-image.png";
  }, [product?.thumbnail, product?.gallery_main_image?.image, galleryItems]);

  const activeDisplayUrl =
    displayIndex === null
      ? productMainUrl
      : galleryItems[displayIndex]?.url || productMainUrl;

  useEffect(() => {
    if (displayIndex === null) return;
    if (!galleryItems.length) {
      setDisplayIndex(null);
      return;
    }
    if (displayIndex < 0 || displayIndex > galleryItems.length - 1) {
      setDisplayIndex(clampIndex(displayIndex, galleryItems.length));
    }
  }, [displayIndex, galleryItems.length]);

  /* =====================================================
     THUMB LIMIT (+N)
  ====================================================== */
  const MAX_THUMBS = 5;
  const VISIBLE_GALLERY_WHEN_OVERFLOW = 3;
  const totalThumbs = 1 + galleryItems.length;
  const isOverflow = totalThumbs > MAX_THUMBS;

  const visibleGalleryItems = useMemo(() => {
    if (!isOverflow) return galleryItems;
    return galleryItems.slice(0, VISIBLE_GALLERY_WHEN_OVERFLOW);
  }, [galleryItems, isOverflow]);

  const hiddenCount = useMemo(() => {
    if (!isOverflow) return 0;
    return Math.max(0, totalThumbs - (1 + VISIBLE_GALLERY_WHEN_OVERFLOW));
  }, [isOverflow, totalThumbs]);

  /* =====================================================
     MODAL NAV
  ====================================================== */
  const prevModal = () => {
    if (!galleryItems.length) return;
    setModalDirty(true);
    setModalIndex(
      (prev) => (prev - 1 + galleryItems.length) % galleryItems.length
    );
  };

  const nextModal = () => {
    if (!galleryItems.length) return;
    setModalDirty(true);
    setModalIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const openGalleryAt = (idx: number, markDirty = false) => {
    if (!galleryItems.length) return;
    setModalIndex(clampIndex(idx, galleryItems.length));
    setModalDirty(markDirty);
    setIsGalleryOpen(true);
  };

  const openGallery = () => {
    if (!galleryItems.length) return;

    let idx = 0;
    if (displayIndex !== null) {
      idx = clampIndex(displayIndex, galleryItems.length);
    } else {
      const mainNorm = normalizeString(productMainUrl);
      const found = galleryItems.findIndex(
        (it) => normalizeString(it.url) === mainNorm
      );
      idx = found >= 0 ? found : 0;
    }

    setModalIndex(idx);
    setModalDirty(false);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    if (modalDirty) {
      setDisplayIndex(clampIndex(modalIndex, galleryItems.length));
    }
  };

  useEffect(() => {
    if (!isGalleryOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") prevModal();
      if (e.key === "ArrowRight") nextModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGalleryOpen, galleryItems.length, modalIndex, modalDirty]);

  /* =====================================================
     SELECT ATTRIBUTE VALUE
  ====================================================== */
  const attributes = product?.attributes_grouped || {};

  const toggleValue = (group: string, item: AttributeValueItem) => {
    setSelectedValues((prev) => {
      const cur = prev[group] || [];
      const exists = cur.some((v) => v.id === item.id);

      return exists
        ? { ...prev, [group]: cur.filter((v) => v.id !== item.id) }
        : { ...prev, [group]: [...cur, item] };
    });
  };

  const clearGroup = (group: string) => {
    setSelectedValues((prev) => {
      if (!prev[group]?.length) return prev;
      const next = { ...prev };
      delete next[group];
      return next;
    });
  };

  /* =====================================================
     PRICE (sale + extras)
===================================================== */
  const baseBackendPrice = toNumber(
    product?.final_price ?? product?.price_base ?? 0,
    0
  );
  const sizeExtra = toNumber(selectedSize?.price_extra ?? 0, 0);

  const attrExtra = Object.values(selectedValues)
    .flat()
    .reduce((sum, v) => sum + toNumber(v.price_extra, 0), 0);

  const finalPrice = baseBackendPrice + sizeExtra + attrExtra;

  /* =====================================================
     ADD TO CART
===================================================== */
  const handleAddToCart = async () => {
    const token = getToken();
    if (!token) {
      alert("Bạn cần đăng nhập để thêm vào giỏ hàng.");
      goLogin();
      return;
    }

    if (!product?.id) return;

    const inStock = product?.is_in_stock !== false;
    if (!inStock) {
      alert("Sản phẩm hiện đang hết hàng.");
      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      alert("Vui lòng chọn size trước khi thêm vào giỏ hàng.");
      return;
    }

    const attributeValueIds = Object.values(selectedValues)
      .flat()
      .map((v) => v.id);

    setAdding(true);
    try {
      const payload = {
        product_id: product.id,
        qty: 1,
        size_id: selectedSize?.id ?? null,
        attribute_value_ids: attributeValueIds,
        options: null,
      };

      const res = await cartService.add(payload as any);

      if (res?.status === false) {
        alert(res?.message ?? "Thêm vào giỏ hàng thất bại.");
        return;
      }

      alert("Đã thêm vào giỏ hàng!");
      router.push("/cart");
    } catch (e: any) {
      console.error(e);

      if (e?.response?.status === 401) {
        alert("Bạn cần đăng nhập để thêm vào giỏ hàng.");
        goLogin();
        return;
      }

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.size_id?.[0] ||
        e?.response?.data?.errors?.product_id?.[0] ||
        e?.response?.data?.errors?.qty?.[0] ||
        e?.response?.data?.errors?.attribute_value_ids?.[0] ||
        e?.message ||
        "Thêm vào giỏ hàng thất bại.";

      alert(msg);
    } finally {
      setAdding(false);
    }
  };

  /* =====================================================
     LOADING & ERROR
===================================================== */
  if (loading) {
    return (
      <>
        <Navbar />
        <p className="text-center mt-20 text-white">Loading…</p>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <p className="text-center mt-20 text-red-400">
          Không tìm thấy sản phẩm
        </p>
        <Footer />
      </>
    );
  }

  /* =====================================================
     UI
===================================================== */
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-14 text-white">
        {/* TITLE */}
        <h1 className="flex justify-center mb-10">
          <span className="px-10 py-4 rounded-full text-4xl md:text-5xl font-extrabold tracking-wide bg-black/50 backdrop-blur-3xl border border-white/10 shadow-lg">
            <span className="luxury-glow leading-[1.2] inline-block">
              {product.name}
            </span>
          </span>
        </h1>

        {/* MAIN */}
        <div className="p-8 md:p-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-10">
            {/* ===== GALLERY (LEFT) ===== */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Thumbnails */}
                {(galleryItems.length > 0 || productMainUrl) && (
                  <div
                    className="
                      flex md:flex-col gap-2
                      md:max-h-[520px]
                      overflow-x-auto md:overflow-y-auto
                      pr-1
                      scrollbar-hide
                    "
                  >
                    {/* Ảnh sản phẩm (default) */}
                    <button
                      type="button"
                      onClick={() => setDisplayIndex(null)}
                      className={`
                        relative shrink-0 rounded-xl p-[2px]
                        bg-white/5 shadow-md shadow-black/25 transition
                        hover:-translate-y-0.5 hover:shadow-lg
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70
                        before:content-[''] before:absolute before:inset-0 before:rounded-xl before:border-2
                        before:pointer-events-none
                        ${
                          displayIndex === null
                            ? "before:border-amber-400"
                            : "before:border-white/15 hover:before:border-white/30"
                        }
                      `}
                    >
                      <div className="w-14 h-14 md:w-[64px] md:h-[64px] rounded-[10px] overflow-hidden bg-black/10">
                        <img
                          src={productMainUrl}
                          alt="product-main"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        />
                      </div>
                    </button>

                    {/* Gallery thumbs */}
                    {visibleGalleryItems.map((it, idx) => (
                      <button
                        key={it.key}
                        type="button"
                        onClick={() =>
                          setDisplayIndex(clampIndex(idx, galleryItems.length))
                        }
                        className={`
                          relative shrink-0 rounded-xl p-[2px]
                          bg-white/5 shadow-md shadow-black/25 transition
                          hover:-translate-y-0.5 hover:shadow-lg
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70
                          before:content-[''] before:absolute before:inset-0 before:rounded-xl before:border-2
                          before:pointer-events-none
                          ${
                            displayIndex === idx
                              ? "before:border-amber-400"
                              : "before:border-white/15 hover:before:border-white/30"
                          }
                        `}
                      >
                        <div className="w-14 h-14 md:w-[64px] md:h-[64px] rounded-[10px] overflow-hidden bg-black/10">
                          <img
                            src={it.url}
                            alt={`thumb-${idx}`}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "/no-image.png")}
                          />
                        </div>
                      </button>
                    ))}

                    {/* Ô +n */}
                    {isOverflow && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryAt(VISIBLE_GALLERY_WHEN_OVERFLOW, false)
                        }
                        className={`
                          relative shrink-0 rounded-xl p-[2px]
                          bg-white/5 shadow-md shadow-black/25 transition
                          hover:-translate-y-0.5 hover:shadow-lg
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70
                          before:content-[''] before:absolute before:inset-0 before:rounded-xl before:border-2
                          before:pointer-events-none
                          before:border-white/15 hover:before:border-white/30
                        `}
                      >
                        <div className="w-14 h-14 md:w-[64px] md:h-[64px] rounded-[10px] overflow-hidden bg-black/40 flex items-center justify-center">
                          <span className="text-white font-extrabold text-lg">
                            +{hiddenCount}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Main image */}
                <button
                  type="button"
                  onClick={openGallery}
                  className="
                    relative group flex-1
                    rounded-3xl overflow-hidden
                    border border-white/20
                    bg-gradient-to-br from-white/10 to-black/10
                    shadow-2xl shadow-black/40
                  "
                >
                  <div className="aspect-square w-full">
                    <img
                      src={activeDisplayUrl || ""}
                      className="w-full h-full object-cover"
                      alt={product.name}
                      onError={(e) => (e.currentTarget.src = "/no-image.png")}
                    />
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/20" />
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-6">
              {/* SIZE PICKER */}
              {sizes.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-2xl font-bold mb-4">Chọn Size</h3>

                  <div className="flex flex-wrap gap-3">
                    {sizes.map((s) => {
                      const active = selectedSize?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSize(s)}
                          className={`
                            px-4 py-2 rounded-xl border text-sm font-semibold transition
                            ${
                              active
                                ? "bg-amber-500/25 border-amber-400/60"
                                : "bg-white/10 border-white/15 hover:bg-white/15"
                            }
                          `}
                        >
                          {s.name}
                          {s.price_extra > 0
                            ? ` (+${s.price_extra.toLocaleString("vi-VN")}₫)`
                            : ""}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSize ? (
                    <div className="mt-3 text-xs text-white/70">
                      Đang chọn: <b className="text-white">{selectedSize.name}</b>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-amber-200">
                      Vui lòng chọn size để tránh lỗi “size_id invalid”.
                    </div>
                  )}
                </div>
              )}

              {/* ATTRIBUTES */}
              {Object.keys(attributes).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-2xl font-bold mb-4">Tuỳ chọn thêm</h3>

                  <div className="flex flex-col gap-3">
                    {Object.entries(attributes).map(([group]) => (
                      <div key={group}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveGroup(group)}
                            className="
                              flex-1 px-4 py-3 rounded-xl
                              bg-white/10 border border-white/15
                              text-left text-base font-semibold
                              hover:bg-white/15 transition
                            "
                          >
                            {group} →
                          </button>

                          <button
                            type="button"
                            onClick={() => clearGroup(group)}
                            className="
                              px-3 py-3 rounded-xl
                              bg-white/10 border border-white/15
                              text-xs font-semibold
                              hover:bg-white/15 transition
                              disabled:opacity-50
                            "
                            disabled={!selectedValues[group]?.length}
                            title="Xóa lựa chọn của group này"
                          >
                            Clear
                          </button>
                        </div>

                        {selectedValues[group]?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedValues[group].map((v) => (
                              <span
                                key={v.id}
                                className="px-3 py-1 text-xs rounded-full bg-amber-500/25 border border-amber-400/35"
                              >
                                {v.name}
                                {v.price_extra > 0
                                  ? ` (+${v.price_extra.toLocaleString("vi-VN")}₫)`
                                  : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRICE */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm text-white/70">Giá</div>

                    <p className="text-5xl font-extrabold text-green-300 leading-none">
                      {finalPrice.toLocaleString("vi-VN")}₫
                    </p>

                    <div className="mt-2 text-xs text-white/70 space-y-1">
                      <div>
                        Base (sale):{" "}
                        <b className="text-white">{currencyVND(baseBackendPrice)}</b>
                      </div>
                      {sizeExtra > 0 && (
                        <div>
                          Size extra:{" "}
                          <b className="text-white">+ {currencyVND(sizeExtra)}</b>
                        </div>
                      )}
                      {attrExtra > 0 && (
                        <div>
                          Attribute extra:{" "}
                          <b className="text-white">+ {currencyVND(attrExtra)}</b>
                        </div>
                      )}
                    </div>

                    {product.is_on_sale && (
                      <p
                        className="
                          mt-3 inline-block px-2 py-1 rounded-lg
                          bg-black/30 text-sm font-semibold text-red-200
                          line-through decoration-red-300 decoration-2
                        "
                      >
                        {toNumber(product.price_base, 0).toLocaleString("vi-VN")}₫
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-white/60">
                    {product.is_in_stock !== false ? "Còn hàng" : "Hết hàng"}
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.is_in_stock === false}
                  className="
                    w-full py-4 rounded-2xl text-lg font-bold
                    bg-gradient-to-r from-amber-400 to-orange-600
                    hover:-translate-y-0.5 transition-all shadow-xl
                    disabled:opacity-60 disabled:hover:translate-y-0
                  "
                >
                  {adding ? "Đang thêm..." : isAuthed ? "Thêm vào giỏ hàng" : "Đăng nhập để mua"}
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          {product.content && (
            <div
              className="prose prose-invert max-w-none p-8 bg-white/10 rounded-2xl backdrop-blur-2xl mt-10 border border-white/20"
              dangerouslySetInnerHTML={{ __html: product.content }}
            />
          )}
        </div>

        {/* ATTRIBUTE POPUP */}
        {activeGroup && attributes[activeGroup] && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
            <div className="p-8 w-full max-w-md bg-black/70 border border-white/15 rounded-2xl">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-2xl font-bold">{activeGroup}</h3>
                <button
                  onClick={() => clearGroup(activeGroup)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  Clear group
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {attributes[activeGroup].map((item) => (
                  <label
                    key={item.id}
                    className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 flex justify-between items-center cursor-pointer"
                  >
                    <span className="text-sm">
                      {item.name}
                      {item.price_extra > 0
                        ? ` (+${item.price_extra.toLocaleString("vi-VN")}₫)`
                        : ""}
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        selectedValues[activeGroup]?.some((v) => v.id === item.id) || false
                      }
                      onChange={() => toggleValue(activeGroup, item)}
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => setActiveGroup(null)}
                className="w-full py-3 text-base font-bold rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* RELATED (random rồi nên không bị lặp 4 món cố định) */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="w-full flex justify-center mb-10">
              <span className="shine-title">SẢN PHẨM CÓ THỂ BẠN THÍCH</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related
                .filter((p) => p?.id !== product.id && p?.slug !== product.slug)
                .map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
            </div>
          </div>
        )}
      </main>

      {/* ===== GALLERY MODAL ===== */}
      {isGalleryOpen && galleryItems.length > 0 && (
        <div
          className="fixed inset-0 z-[999] bg-black/75 flex items-center justify-center p-4"
          onClick={closeGallery}
        >
          <div
            className="w-full max-w-3xl bg-black/60 border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="font-semibold text-white truncate">{product.name}</div>

              <button
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm"
                onClick={closeGallery}
              >
                Close
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                  onClick={prevModal}
                >
                  Prev
                </button>

                <div className="flex-1 flex justify-center">
                  <img
                    src={galleryItems[modalIndex]?.url}
                    alt={`gallery-${modalIndex}`}
                    className="max-h-[420px] w-auto object-contain rounded-xl border border-white/15 bg-black"
                    onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  />
                </div>

                <button
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                  onClick={nextModal}
                >
                  Next
                </button>
              </div>

              {galleryItems.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {galleryItems.map((it, idx) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => {
                        setModalDirty(true);
                        setModalIndex(clampIndex(idx, galleryItems.length));
                      }}
                      className={`
                        relative shrink-0 rounded-xl p-[2px] bg-black/30 transition hover:-translate-y-0.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70
                        before:content-[''] before:absolute before:inset-0 before:rounded-xl before:border-2
                        before:pointer-events-none
                        ${
                          idx === modalIndex
                            ? "before:border-amber-400"
                            : "before:border-white/10 hover:before:border-white/25"
                        }
                      `}
                    >
                      <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-black">
                        <img
                          src={it.url}
                          className="w-14 h-14 object-cover"
                          alt={`thumb-modal-${idx}`}
                          onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
