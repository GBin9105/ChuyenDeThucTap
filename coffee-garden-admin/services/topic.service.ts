import { api } from "@/lib/api";

export type TopicPayload = {
  name: string;
  description?: string;
  sort_order?: number;
  status?: number;
};

export class TopicService {
  // =======================
  // GET ALL TOPICS (ADMIN)
  // =======================
  async all(params?: { page?: number }) {
    return api.get("/admin/topics", { params });
  }

  // =======================
  // GET ONE TOPIC
  // =======================
  async get(id: number) {
    return api.get(`/admin/topics/${id}`);
  }

  // =======================
  // CREATE TOPIC
  // =======================
  async create(data: TopicPayload) {
    return api.post("/admin/topics", data);
  }

  // =======================
  // UPDATE TOPIC
  // =======================
  async update(id: number, data: TopicPayload) {
    return api.put(`/admin/topics/${id}`, data);
  }

  // =======================
  // DELETE TOPIC
  // =======================
  async delete(id: number) {
    return api.delete(`/admin/topics/${id}`);
  }
}

export const topicService = new TopicService();
