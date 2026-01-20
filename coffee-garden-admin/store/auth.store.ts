import { create } from "zustand";

interface UserStore {
  user: any;
  setUser: (u: any) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (u) => set({ user: u }),

  logout: () =>
    set(() => {
      localStorage.removeItem("token");
      return { user: null };
    }),
}));
