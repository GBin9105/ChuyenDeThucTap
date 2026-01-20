"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { postService } from "@/services/post.service";
import { topicService } from "@/services/topic.service";

type Topic = {
  id: number;
  name: string;
};

type PostForm = {
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  content: string;
  topic_id: number | "";
  status: number;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<PostForm>({
    title: "",
    slug: "",
    thumbnail: "",
    description: "",
    content: "",
    topic_id: "",
    status: 1,
  });

  /* ===========================================
   * LOAD TOPICS + POST
   * =========================================== */
  useEffect(() => {
    if (!id) return;

    Promise.all([
      topicService.all(),
      postService.get(id),
    ])
      .then(([topicRes, postRes]) => {
        setTopics(
          topicRes.data?.data?.data ??
          topicRes.data?.data ??
          []
        );

        const p = postRes.data?.data;
        if (!p) return;

        setForm({
          title: p.title ?? "",
          slug: p.slug ?? "",
          thumbnail: p.thumbnail ?? "",
          description: p.description ?? "",
          content: p.content ?? "",
          topic_id: p.topic_id ?? "",
          status: p.status ?? 1,
        });

        setPreview(p.thumbnail ?? "");
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải dữ liệu bài viết");
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ===========================================
   * SLUG GENERATOR (VI + EN)
   * =========================================== */
  const generateSlug = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  /* ===========================================
   * HANDLE CHANGE
   * =========================================== */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated: PostForm = {
        ...prev,
        [name]: name === "topic_id" ? Number(value) || "" : value,
      };

      if (name === "title") {
        updated.slug = generateSlug(value);
      }

      if (name === "thumbnail") {
        setPreview(value);
      }

      return updated;
    });
  };

  /* ===========================================
   * SUBMIT UPDATE
   * =========================================== */
  const handleSubmit = async () => {
    setError("");

    if (!form.title || !form.topic_id) {
      setError("Vui lòng nhập đầy đủ Title và Topic");
      return;
    }

    try {
      setSubmitting(true);

      await postService.update(id, {
        ...form,
        topic_id: Number(form.topic_id),
      });

      router.push("/admin/posts");
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật bài viết!");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===========================================
   * UI
   * =========================================== */
  if (loading) {
    return (
      <div className="p-6 text-lg text-black">
        Loading post...
      </div>
    );
  }

  return (
    <div className="p-6 flex justify-center">
      <div
        className="
          w-full max-w-3xl p-8 rounded-2xl
          bg-white/40 backdrop-blur-lg
          border border-white/60
          shadow-[0_0_25px_rgba(90,120,255,0.35)]
        "
      >
        <h2 className="text-2xl font-semibold text-black mb-6">
          Edit Post
        </h2>

        {error && (
          <div className="bg-red-200 text-red-700 p-3 rounded mb-4 shadow">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* TITLE */}
          <div>
            <label className="text-black font-medium">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="text-black font-medium">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* THUMBNAIL */}
          <div>
            <label className="text-black font-medium">Thumbnail URL</label>
            <input
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />

            {preview && (
              <img
                src={preview}
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).src =
                    "/no-image.png")
                }
                className="
                  mt-3 w-48 h-32 object-cover rounded-lg
                  border border-gray-300 bg-white/80
                  shadow-[0_0_10px_rgba(90,120,255,0.35)]
                "
              />
            )}
          </div>

          {/* TOPIC */}
          <div>
            <label className="text-black font-medium">Topic</label>
            <select
              name="topic_id"
              value={form.topic_id}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            >
              <option value="">-- Select Topic --</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-black font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* CONTENT */}
          <div>
            <label className="text-black font-medium">Content</label>
            <textarea
              name="content"
              rows={6}
              value={form.content}
              onChange={handleChange}
              className="
                w-full px-4 py-3 rounded-lg mt-1
                bg-white/70 border border-gray-300 text-black
                focus:border-blue-500 focus:ring focus:ring-blue-300/40
              "
            />
          </div>

          {/* SUBMIT */}
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              shadow-[0_0_18px_rgba(90,120,255,0.45)]
              transition disabled:opacity-50
            "
          >
            {submitting ? "Updating..." : "Update Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
