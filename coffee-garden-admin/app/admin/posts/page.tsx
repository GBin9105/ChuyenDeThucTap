"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { postService } from "@/services/post.service";

type Post = {
  id: number;
  title: string;
  thumbnail?: string;
  created_at: string;
  topic?: {
    id: number;
    name: string;
  };
};

export default function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== PAGINATION =====
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // ===========================================
  // LOAD POSTS
  // ===========================================
  useEffect(() => {
    loadPosts(page);
  }, [page]);

  const loadPosts = async (pageNumber: number) => {
    try {
      setLoading(true);

      const res = await postService.all({ page: pageNumber });

      const data = res.data?.data;

      setPosts(data?.data || []);
      setLastPage(data?.last_page || 1);
    } catch (err) {
      console.error("Load posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // DELETE POST
  // ===========================================
  const deletePost = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết?")) return;

    try {
      await postService.delete(id);
      loadPosts(page);
    } catch (err) {
      console.error(err);
      alert("Không thể xóa bài viết!");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-lg text-black">
        Loading posts...
      </div>
    );
  }

  // ===========================================
  // UI
  // ===========================================
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text-black">
          Posts
        </h1>

        <Link
          href="/admin/posts/create"
          className="
            px-5 py-2 rounded-lg text-white font-medium
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-700 hover:to-indigo-700
            shadow-[0_0_15px_rgba(80,110,255,0.5)]
            transition
          "
        >
          + Add New
        </Link>
      </div>

      {/* TABLE */}
      <div
        className="
          overflow-x-auto rounded-2xl 
          bg-white/40 backdrop-blur-md 
          border border-white/60
          shadow-[0_0_25px_rgba(90,120,255,0.25)]
        "
      >
        <table className="min-w-max w-full text-sm text-black border-collapse">
          <thead className="bg-white/60 border-b border-gray-300">
            <tr>
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Thumbnail</th>
              <th className="p-3 border">Title</th>
              <th className="p-3 border">Topic</th>
              <th className="p-3 border">Created</th>
              <th className="p-3 border text-center w-40">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-600"
                >
                  No posts found
                </td>
              </tr>
            )}

            {posts.map((p) => (
              <tr
                key={p.id}
                className="
                  hover:bg-white/50 transition 
                  border-b border-gray-300
                "
              >
                {/* ID */}
                <td className="p-3 border">
                  {p.id}
                </td>

                {/* THUMBNAIL */}
                <td className="p-3 border">
                  <img
                    src={
                      p.thumbnail?.startsWith("http")
                        ? p.thumbnail
                        : p.thumbnail
                        ? `http://localhost:8000/${p.thumbnail}`
                        : "/no-image.png"
                    }
                    onError={(e) => {
                      if (
                        (e.currentTarget as HTMLImageElement)
                          .dataset.fallback
                      )
                        return;
                      e.currentTarget.src = "/no-image.png";
                      e.currentTarget.dataset.fallback = "1";
                    }}
                    className="
                      w-16 h-16 object-cover rounded-lg 
                      border bg-gray-100
                      shadow-[0_0_10px_rgba(90,120,255,0.2)]
                    "
                    alt={p.title}
                  />
                </td>

                {/* TITLE */}
                <td className="p-3 border font-medium">
                  {p.title}
                </td>

                {/* TOPIC */}
                <td className="p-3 border">
                  {p.topic?.name ?? "—"}
                </td>

                {/* CREATED */}
                <td className="p-3 border">
                  {new Date(p.created_at).toLocaleString()}
                </td>

                {/* ACTIONS */}
                <td className="p-3 border text-center space-x-2">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="
                      px-3 py-1 rounded-lg text-white
                      bg-yellow-500/90 hover:bg-yellow-500
                      shadow-[0_0_12px_rgba(255,200,0,0.45)]
                      transition
                    "
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => deletePost(p.id)}
                    className="
                      px-3 py-1 rounded-lg text-white
                      bg-red-500/90 hover:bg-red-600
                      shadow-[0_0_12px_rgba(255,50,50,0.45)]
                      transition
                    "
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {lastPage > 1 && (
        <div className="flex justify-center gap-4 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="
              px-4 py-2 rounded-lg bg-white/70 border
              disabled:opacity-40
            "
          >
            ← Prev
          </button>

          <span className="px-4 py-2 font-medium">
            Page {page} / {lastPage}
          </span>

          <button
            disabled={page === lastPage}
            onClick={() =>
              setPage((p) => Math.min(lastPage, p + 1))
            }
            className="
              px-4 py-2 rounded-lg bg-white/70 border
              disabled:opacity-40
            "
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
