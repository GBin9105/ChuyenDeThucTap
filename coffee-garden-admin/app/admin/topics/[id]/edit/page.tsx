"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { topicService } from "@/services/topic.service";

export default function EditTopicPage() {
  const router = useRouter();
  const { id } = useParams();
  const topicId = Number(id);

  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    sort_order: 0,
    status: 1,
  });

  useEffect(() => {
    topicService.get(topicId).then((res) => {
      const t = res.data?.data;
      if (!t) return;
      setForm({
        name: t.name ?? "",
        description: t.description ?? "",
        sort_order: t.sort_order ?? 0,
        status: t.status ?? 1,
      });
    });
  }, [topicId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "sort_order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setError("Tên topic không được để trống");
      return;
    }

    try {
      await topicService.update(topicId, form);
      router.push("/admin/topics");
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật topic");
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-xl p-8 rounded-2xl bg-white/40 backdrop-blur-lg border shadow">
        <h2 className="text-2xl font-semibold mb-6">Edit Topic</h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded border"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded border"
          />

          <input
            name="sort_order"
            type="number"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded border"
          />

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Update Topic
          </button>
        </div>
      </div>
    </div>
  );
}
