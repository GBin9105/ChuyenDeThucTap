"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardService } from "@/services/dashboard.service";
import { RevenueLineChart } from "@/components/charts/line-chart";

type Summary = {
  totalOrders: number;
  totalRevenue: number | string; // backend có thể trả string do decimal
  totalUsers: number;
  totalProducts: number;
};

type TopProduct = {
  id: number;
  name: string;
  total_sold: number;
};

type RevenuePoint = Record<string, any>; // tuỳ format chart component

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<RevenuePoint[]>([]);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [summaryRes, chartRes, topRes] = await Promise.all([
          DashboardService.summary(),
          // nếu service của bạn hỗ trợ params: DashboardService.revenueChart({ days: 7 })
          DashboardService.revenueChart(),
          // nếu service của bạn hỗ trợ params: DashboardService.topProducts({ limit: 5 })
          DashboardService.topProducts(),
        ]);

        if (cancelled) return;

        const s = summaryRes.data as Summary;

        // Ép kiểu số để tránh lỗi/hiển thị sai khi backend trả decimal string
        const normalizedSummary: Summary = {
          totalOrders: Number((s as any).totalOrders ?? 0),
          totalRevenue: Number((s as any).totalRevenue ?? 0),
          totalUsers: Number((s as any).totalUsers ?? 0),
          totalProducts: Number((s as any).totalProducts ?? 0),
        };

        setSummary(normalizedSummary);

        const chartData = Array.isArray(chartRes.data) ? chartRes.data : [];
        setChart(chartData);

        const topData = Array.isArray(topRes.data) ? topRes.data : [];
        setTop(topData);
      } catch (e: any) {
        if (cancelled) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load dashboard data."
        );
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = useMemo(() => {
    const totalRevenueNumber = Number(summary?.totalRevenue ?? 0);

    return [
      {
        label: "Total Orders",
        value: summary?.totalOrders ?? 0,
      },
      {
        label: "Revenue",
        value: totalRevenueNumber.toLocaleString("vi-VN") + " đ",
      },
      {
        label: "Users",
        value: summary?.totalUsers ?? 0,
      },
      {
        label: "Products",
        value: summary?.totalProducts ?? 0,
      },
    ];
  }, [summary]);

  if (loading) {
    return <div className="p-6 text-black text-lg">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-black text-lg font-semibold">Dashboard error</div>
        <div className="text-red-600">{error}</div>
        <div className="text-gray-700 text-sm">
          Tip: kiểm tra NEXT_PUBLIC_API_URL có chứa <b>/api</b> (vd:
          http://localhost:8000/api) và mở DevTools → Network để xem response của
          /admin/dashboard/summary.
        </div>
      </div>
    );
  }

  // Nếu summary null vì lý do nào đó, vẫn render fallback để không trắng trang
  const safeSummary = summary ?? {
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((item, index) => (
          <div
            key={index}
            className="
              p-6 rounded-2xl
              bg-white/40 backdrop-blur-md
              border border-gray-300
              shadow-[0_0_20px_rgba(90,120,255,0.25)]
            "
          >
            <p className="text-gray-600 text-sm">{item.label}</p>
            <p className="text-3xl font-semibold text-black mt-1">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ===================== REVENUE CHART ===================== */}
      <div
        className="
          p-6 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_20px_rgba(90,120,255,0.25)]
        "
      >
        <h2 className="text-xl font-semibold text-black mb-4">Revenue</h2>

        {chart.length > 0 ? (
          <RevenueLineChart data={chart} />
        ) : (
          <p className="text-gray-600">No chart data.</p>
        )}
      </div>

      {/* ===================== TOP PRODUCTS ===================== */}
      <div
        className="
          p-6 rounded-2xl
          bg-white/40 backdrop-blur-md
          border border-gray-300
          shadow-[0_0_20px_rgba(90,120,255,0.25)]
        "
      >
        <h2 className="text-xl font-semibold text-black mb-4">
          Top Selling Products
        </h2>

        <div className="space-y-3">
          {top.map((item) => (
            <div
              key={item.id}
              className="
                flex justify-between items-center
                bg-white/60 rounded-lg px-4 py-3
                border border-gray-300
                shadow-sm
              "
            >
              <span className="text-black font-medium">{item.name}</span>
              <span className="text-indigo-700 font-bold">
                {item.total_sold}
              </span>
            </div>
          ))}

          {top.length === 0 && (
            <p className="text-gray-600">No products available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
