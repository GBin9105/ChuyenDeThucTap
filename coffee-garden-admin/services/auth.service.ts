import { api } from "@/lib/api";

type UpdateMePayload = {
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
};

class AuthService {
  async login(data: { username: string; password: string }) {
    const res = await api.post("/auth/login", data);
    return res.data;
  }

  async me() {
    const res = await api.get("/auth/me");
    return res.data.user;
  }

  async updateMe(payload: UpdateMePayload) {
    const res = await api.put("/auth/me", payload);
    return res.data; // { message, user }
  }

  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  }
}

export default new AuthService();
