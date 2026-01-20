import { api } from "@/lib/api";

export class AttributeService {

  /**
   * GET ALL ATTRIBUTE GROUPS + VALUES
   */
  async all() {
    const res = await api.get("/admin/attributes");
    const data = res?.data?.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * GET A SINGLE GROUP
   */
  async get(id: number) {
    const res = await api.get(`/admin/attributes/${id}`);
    return res?.data?.data ?? null;
  }

  /**
   * CREATE NEW GROUP
   * payload = { name }
   */
  async create(payload: any) {
    const res = await api.post("/admin/attributes", payload);
    return res?.data?.data ?? null;
  }

  /**
   * UPDATE GROUP
   * payload = { name }
   */
  async update(id: number, payload: any) {
    const res = await api.put(`/admin/attributes/${id}`, payload);
    return res?.data?.data ?? null;
  }

  /**
   * DELETE GROUP
   */
  async delete(id: number) {
    const res = await api.delete(`/admin/attributes/${id}`);
    return res?.data ?? { status: false };
  }

  /**
   * ADD VALUE TO A GROUP
   * payload = { name, price_extra }
   */
  async addValue(groupId: number, payload: any) {
    const res = await api.post(`/admin/attributes/${groupId}/value`, payload);
    return res?.data?.data ?? null;
  }

  /**
   * UPDATE VALUE
   * payload = { name, price_extra }
   */
  async updateValue(valueId: number, payload: any) {
    const res = await api.put(`/admin/attributes/value/${valueId}`, payload);
    return res?.data?.data ?? null;
  }

  /**
   * DELETE VALUE
   */
  async deleteValue(valueId: number) {
    const res = await api.delete(`/admin/attributes/value/${valueId}`);
    return res?.data ?? { status: false };
  }
}

export const attributeService = new AttributeService();
