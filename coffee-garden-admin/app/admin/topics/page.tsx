"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { topicService } from "@/services/topic.service";

type Topic = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  status: number;
};

export default function TopicListPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const res = await topicService.all();
      setTopics(res.data?.data?.data ?? res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa topic?")) return;
    try {
      await topicService.delete(id);
      loadTopics();
    } catch {
      alert("Không thể xóa topic!");
    }
  };

  if (loading) return <div className="p-6">Loading topics...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-black">Topics</h1>
        <Link
          href="/admin/topics/create"
          className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          + Add Topic
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white/40 backdrop-blur-md border shadow">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-white/60">
            <tr>
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Slug</th>
              <th className="p-3 border">Order</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-3 border">{t.id}</td>
                <td className="p-3 border">{t.name}</td>
                <td className="p-3 border text-gray-600">{t.slug}</td>
                <td className="p-3 border">{t.sort_order}</td>
                <td className="p-3 border">
                  {t.status ? "Active" : "Hidden"}
                </td>
                <td className="p-3 border text-center space-x-2">
                  <Link
                    href={`/admin/topics/${t.id}/edit`}
                    className="px-3 py-1 rounded bg-yellow-500 text-white"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteTopic(t.id)}
                    className="px-3 py-1 rounded bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No topics found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
