import { api } from "@/lib/api";

/* =========================================================
 * TYPES
 * ========================================================= */

export interface ProductInventory {
  product_id: number;
  stock: number;
  cost_price: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image: string;
  is_main: boolean;
  sort_order: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductItem {
  id: number;
  name: string;
  slug: string;
  thumbnail: string;
  price_base: number;
  status: number;

  inventory?: ProductInventory;

  category?: {
    id: number;
    name: string;
  };

  /* ======================
   * GALLERY
   * ====================== */
  images?: ProductImage[];

  /**
   * FE sẽ dùng thống nhất field này
   */
  galleryMainImage?: ProductImage | null;

  /**
   * Các key có thể đến từ BE (để TS không báo lỗi)
   * - Laravel relation mainImage -> main_image (default)
   * - Một số BE custom -> mainImage
   * - Một số BE khác -> gallery_main_image
   */
  main_image?: ProductImage | null;
  mainImage?: ProductImage | null;
  gallery_main_image?: ProductImage | null;
}

/* =========================================================
 * NORMALIZE HELPERS
 * ========================================================= */

function asArray<T>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}

function pickFirstDefined<T>(...vals: T[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function normalizeProduct(raw: any): ProductItem {
  const images = asArray<ProductImage>(raw?.images);

  const main =
    pickFirstDefined<ProductImage | null>(
      raw?.galleryMainImage,
      raw?.gallery_main_image,
      raw?.main_image,
      raw?.mainImage
    ) ?? null;

  return {
    ...raw,
    images,
    galleryMainImage: main,
  };
}

/* =========================================================
 * SERVICE
 * ========================================================= */
export class ProductService {
  /**
   * ==================================================
   * GET ALL PRODUCTS (ADMIN)
   * API: GET /api/admin/products
   * ==================================================
   */
  async all(): Promise<ProductItem[]> {
    const res = await api.get("/admin/products");

    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];

    return list.map(normalizeProduct);
  }

  /**
   * ==================================================
   * GET ONE PRODUCT (ADMIN)
   * API: GET /api/admin/products/{id}
   * ==================================================
   */
  async get(id: number): Promise<ProductItem | null> {
    const res = await api.get(`/admin/products/${id}`);

    const raw =
      (res.data?.id ? res.data : null) ??
      (res.data?.data ? res.data.data : null) ??
      (res.data?.product ? res.data.product : null);

    if (!raw) return null;

    return normalizeProduct(raw);
  }

  /**
   * ==================================================
   * CREATE PRODUCT
   * API: POST /api/admin/products
   * ==================================================
   */
  async create(payload: {
    name: string;
    slug?: string;
    thumbnail: string;
    content?: string;
    description?: string;
    price_base: number;
    category_id: number;
    status?: number;
    attributes?: any[];
  }): Promise<ProductItem> {
    const res = await api.post("/admin/products", payload);

    const raw =
      (res.data?.product ? res.data.product : null) ??
      (res.data?.data ? res.data.data : null) ??
      res.data;

    return normalizeProduct(raw);
  }

  /**
   * ==================================================
   * UPDATE PRODUCT (NO INVENTORY)
   * API: PUT /api/admin/products/{id}
   * ==================================================
   */
  async update(
    id: number,
    payload: {
      name: string;
      slug?: string;
      thumbnail: string;
      content?: string;
      description?: string;
      price_base: number;
      category_id: number;
      status?: number;
      attributes?: any[];
    }
  ): Promise<ProductItem> {
    const res = await api.put(`/admin/products/${id}`, payload);

    const raw =
      (res.data?.product ? res.data.product : null) ??
      (res.data?.data ? res.data.data : null) ??
      res.data;

    return normalizeProduct(raw);
  }

  /**
   * ==================================================
   * DELETE PRODUCT
   * API: DELETE /api/admin/products/{id}
   * ==================================================
   */
  async delete(id: number): Promise<{ status: boolean }> {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  }

  /**
   * ==================================================
   * UPDATE ATTRIBUTES ONLY
   * API: PUT /api/admin/products/{id}
   * ==================================================
   */
  async updateAttributes(
    productId: number,
    attributes: {
      id: number;
      active?: number;
    }[]
  ): Promise<ProductItem> {
    const res = await api.put(`/admin/products/${productId}`, { attributes });

    const raw =
      (res.data?.product ? res.data.product : null) ??
      (res.data?.data ? res.data.data : null) ??
      res.data;

    return normalizeProduct(raw);
  }

  /* ==================================================
   * ================== GALLERY ========================
   * ================================================== */

  /**
   * GET PRODUCT IMAGES (ADMIN)
   * API: GET /api/admin/products/{productId}/images
   *
   * Lưu ý: Endpoint này chỉ chạy nếu BE có route/controller tương ứng.
   * Nếu BE chưa có, bạn có thể bỏ hàm này và dùng product.images từ /admin/products/{id}.
   */
  async getImages(productId: number): Promise<ProductImage[]> {
    const res = await api.get(`/admin/products/${productId}/images`);
    return Array.isArray(res.data) ? res.data : asArray<ProductImage>(res.data?.data);
  }

  /**
   * ADD IMAGE
   * API: POST /api/admin/product-images
   */
  async addImage(payload: {
    product_id: number;
    image: string;
    is_main?: boolean;
    sort_order?: number;
    status?: number;
  }): Promise<ProductImage> {
    const res = await api.post(`/admin/product-images`, payload);
    return res.data?.data ?? res.data;
  }

  /**
   * UPDATE IMAGE
   * API: PUT /api/admin/product-images/{id}
   */
  async updateImage(
    id: number,
    payload: Partial<{
      image: string;
      is_main: boolean;
      sort_order: number;
      status: number;
    }>
  ): Promise<ProductImage> {
    const res = await api.put(`/admin/product-images/${id}`, payload);
    return res.data?.data ?? res.data;
  }

  /**
   * DELETE IMAGE
   * API: DELETE /api/admin/product-images/{id}
   */
  async deleteImage(id: number): Promise<{ status: boolean }> {
    const res = await api.delete(`/admin/product-images/${id}`);
    return res.data;
  }

  /**
   * SET MAIN IMAGE
   * API: POST /api/admin/product-images/{id}/set-main
   */
  async setMainImage(id: number): Promise<ProductImage> {
    const res = await api.post(`/admin/product-images/${id}/set-main`);
    return res.data?.data ?? res.data;
  }

  /**
   * REORDER IMAGES
   * API: POST /api/admin/product-images/reorder
   */
  async reorderImages(items: { id: number; sort_order: number }[]) {
    return api.post(`/admin/product-images/reorder`, { items });
  }
}

export const productService = new ProductService();
