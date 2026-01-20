import { api } from "@/lib/api";

class AuthService {
  async login(data: { username: string; password: string }) {
    const res = await api.post("/auth/login", data);
    return res.data;
  }

  async me() {
    const res = await api.get("/auth/me");
    return res.data.user;
  }

  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  }
}

export default new AuthService();
