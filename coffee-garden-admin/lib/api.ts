import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // FIX login 422 – đảm bảo axios luôn gửi JSON đúng cách
  transformRequest: [
    function (data, headers) {
      if (headers['Content-Type'] === 'application/json' && typeof data === 'object') {
        return JSON.stringify(data); // ép serialize JSON đúng chuẩn
      }
      return data;
    }
  ]
});

// Attach token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
