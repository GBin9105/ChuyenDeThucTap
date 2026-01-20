import { api } from "@/lib/api";

/**
 * Payload dùng khi CREATE / UPDATE Post (Admin)
 * Khớp với PostRequest (BE)
 */
export type PostPayload = {
  title: string;
  slug?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
  topic_id?: number;
  status?: number;      // 0 | 1
  post_type?: "post" | "page";
};

export class PostService {
  // =======================
  // GET ALL POSTS (ADMIN)
  // =======================
  async all(params?: { page?: number }) {
    try {
      return await api.get("/admin/posts", { params });
    } catch (err) {
      console.error("POST SERVICE → ALL ERROR:", err);
      throw err;
    }
  }

  // =======================
  // GET ONE POST (ADMIN)
  // =======================
  async get(id: number) {
    try {
      return await api.get(`/admin/posts/${id}`);
    } catch (err) {
      console.error("POST SERVICE → GET ERROR:", err);
      throw err;
    }
  }

  // =======================
  // CREATE POST (ADMIN)
  // =======================
  async create(data: PostPayload) {
    try {
      return await api.post("/admin/posts", data);
    } catch (err) {
      console.error("POST SERVICE → CREATE ERROR:", err);
      throw err;
    }
  }

  // =======================
  // UPDATE POST (ADMIN)
  // =======================
  async update(id: number, data: PostPayload) {
    try {
      return await api.put(`/admin/posts/${id}`, data);
    } catch (err) {
      console.error("POST SERVICE → UPDATE ERROR:", err);
      throw err;
    }
  }

  // =======================
  // DELETE POST (ADMIN)
  // =======================
  async delete(id: number) {
    try {
      return await api.delete(`/admin/posts/${id}`);
    } catch (err) {
      console.error("POST SERVICE → DELETE ERROR:", err);
      throw err;
    }
  }
}

export const postService = new PostService();
