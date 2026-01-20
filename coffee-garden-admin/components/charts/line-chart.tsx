"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function RevenueLineChart({ data }: any) {
  return (
    <div className="w-full h-72 border rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Revenue (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#6366f1" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
