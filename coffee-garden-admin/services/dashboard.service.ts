// src/services/dashboard.service.ts
import { api } from "@/lib/api";

export type DashboardSummary = {
  totalOrders: number;
  totalRevenue: number;   // backend nên trả number (float/int), FE vẫn ép Number để chắc chắn
  totalUsers: number;
  totalProducts: number;
};

export type RevenuePoint = {
  // backend có thể trả một hoặc nhiều key; FE dùng cái bạn chọn trong chart component
  date?: string;     // "2026-01-18"
  revenue?: number;  // 123456
  label?: string;    // "18/01"
  value?: number;    // 123456
};

export type TopProduct = {
  id: number;
  name: string;
  total_sold: number;
};

export const DashboardService = {
  summary() {
    return api.get<DashboardSummary>("/admin/dashboard/summary");
  },

  revenueChart(params?: { days?: number }) {
    return api.get<RevenuePoint[]>("/admin/dashboard/revenue-chart", {
      params,
    });
  },

  topProducts(params?: { limit?: number }) {
    return api.get<TopProduct[]>("/admin/dashboard/top-products", {
      params,
    });
  },
};
