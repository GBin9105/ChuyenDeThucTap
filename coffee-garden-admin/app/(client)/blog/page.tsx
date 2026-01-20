"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Topic = {
  id: number;
  name: string;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  description: string | null;
  topic_id: number;
  created_at: string;
};

/* ===========================================
   HELPER: Capitalize Each Word
=========================================== */
const capitalizeWords = (text: string) =>
  text.replace(/\b\w/g, (char) => char.toUpperCase());

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     LOAD POSTS + TOPICS
  ============================================================ */
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/posts", { cache: "no-store" }),
      fetch("http://localhost:8000/api/topics", { cache: "no-store" }),
    ])
      .then(async ([postRes, topicRes]) => {
        const postJson = await postRes.json();
        const topicJson = await topicRes.json();

        // ✅ posts → { success, data }
        setPosts(Array.isArray(postJson?.data) ? postJson.data : []);

        // ✅ topics → { success, data }
        setTopics(Array.isArray(topicJson?.data) ? topicJson.data : []);
      })
      .catch((err) => {
        console.error("LOAD BLOG ERROR:", err);
        setPosts([]);
        setTopics([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ============================================================
     FILTER POSTS BY TOPIC
  ============================================================ */
  const filteredPosts =
    activeTopic === null
      ? posts
      : posts.filter((p) => p.topic_id === activeTopic);

  /* ============================================================
     UI
  ============================================================ */
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* ===== TITLE ===== */}
        <h1 className="w-full flex justify-center">
          <span className="shine-title">BLOG</span>
        </h1>

        {/* ===== TOPIC FILTER ===== */}
        <div className="flex gap-4 flex-wrap justify-center mt-6">
          <button
            onClick={() => setActiveTopic(null)}
            className={`
              min-w-[120px] px-5 py-2 rounded-xl font-semibold
              backdrop-blur-xl border transition-all duration-300
              ${
                activeTopic === null
                  ? "bg-amber-100 border-amber-400 shadow-[0_0_18px_rgba(255,210,90,0.55)]"
                  : "bg-white/70 border-gray-300 hover:border-amber-400 hover:shadow-[0_0_14px_rgba(255,210,90,0.35)]"
              }
            `}
          >
            Tất cả
          </button>

          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`
                min-w-[120px] px-5 py-2 rounded-xl font-semibold
                backdrop-blur-xl border transition-all duration-300
                ${
                  activeTopic === t.id
                    ? "bg-amber-100 border-amber-400 shadow-[0_0_18px_rgba(255,210,90,0.55)]"
                    : "bg-white/70 border-gray-300 hover:border-amber-400 hover:shadow-[0_0_14px_rgba(255,210,90,0.35)]"
                }
              `}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        {loading ? (
          <p className="text-center text-gray-500 mt-10">
            Loading blog...
          </p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No blog posts found
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
            {filteredPosts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="
                  block rounded-2xl overflow-hidden
                  bg-white/70 backdrop-blur-xl
                  border border-white/60
                  shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                  hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)]
                  transition-all duration-300 hover:-translate-y-1
                "
              >
                {/* IMAGE */}
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src={
                      p.thumbnail
                        ? p.thumbnail.startsWith("http")
                          ? p.thumbnail
                          : `http://localhost:8000/${p.thumbnail}`
                        : "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={p.title}
                    className="
                      w-full h-full object-cover
                      transition-transform duration-700
                      hover:scale-110
                    "
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.dataset.fallback) return;
                      img.src =
                        "https://via.placeholder.com/300x300?text=No+Image";
                      img.dataset.fallback = "1";
                    }}
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4">
                  <h3 className="product-name">
                    {capitalizeWords(p.title)}
                  </h3>

                  {p.description && (
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-3">
                    <span className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
