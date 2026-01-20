import { create } from "zustand";

export interface User {
  id: number;
  name?: string;
  email?: string;
  roles?: string;
}

interface UserStore {
  user: User | null;

  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: () => {
    // dọn token cũ nếu trước đây bạn từng dùng token
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({ user: null });
  },
}));
