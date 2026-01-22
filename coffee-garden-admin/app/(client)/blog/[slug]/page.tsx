"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type Post = {
  title: string;
  slug?: string;
  thumbnail: string | null;
  content: string | null;
  created_at: string;
};

type PostListItem = {
  title: string;
  slug: string;
  thumbnail: string | null;
  created_at: string;
  excerpt?: string | null;
};

function toDateLabel(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

function resolveThumbUrl(thumb: string | null) {
  if (!thumb) return null;
  return thumb.startsWith("http") ? thumb : `http://localhost:8000/${thumb}`;
}

// Laravel trả về nhiều kiểu:
// - { data: [...] }
// - { data: { data: [...] , ...pagination } }
function normalizePostList(json: any): PostListItem[] {
  const d = json?.data;

  if (Array.isArray(d)) return d as PostListItem[];
  if (Array.isArray(d?.data)) return d.data as PostListItem[];

  return [];
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // related
  const [related, setRelated] = useState<PostListItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  /* ============================================================
     LOAD POST BY SLUG
  ============================================================ */
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    fetch(`http://localhost:8000/api/posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((json) => {
        setPost(json?.data ?? null);
      })
      .catch((err) => {
        console.error("LOAD POST ERROR:", err);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  /* ============================================================
     LOAD RELATED POSTS
     - lấy list post
     - loại trừ slug hiện tại
     - lấy tối đa 6 bài
  ============================================================ */
  useEffect(() => {
    if (!slug) return;

    setLoadingRelated(true);
    fetch(`http://localhost:8000/api/posts?per_page=12`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load related posts");
        return res.json();
      })
      .then((json) => {
        const list = normalizePostList(json);

        // loại trừ bài hiện tại
        const filtered = (list || []).filter((p) => String(p?.slug) !== String(slug));

        // ưu tiên mới nhất: nếu backend đã sort thì không cần, nhưng mình vẫn sort phòng hờ
        filtered.sort((a, b) => {
          const ta = new Date(a.created_at || "").getTime();
          const tb = new Date(b.created_at || "").getTime();
          return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
        });

        setRelated(filtered.slice(0, 6));
      })
      .catch((err) => {
        console.error("LOAD RELATED ERROR:", err);
        setRelated([]);
      })
      .finally(() => setLoadingRelated(false));
  }, [slug]);

  const postThumb = useMemo(() => resolveThumbUrl(post?.thumbnail ?? null), [post]);

  /* ============================================================
     UI STATES
  ============================================================ */
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-gray-500">
          Loading post...
        </div>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-gray-500">
          Post not found
        </div>
        <Footer />
      </>
    );
  }

  /* ============================================================
     UI
  ============================================================ */
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-14">
        {/* Detail wrapper */}
        <div className="mx-auto max-w-3xl">
          {/* BACK */}
          <Link
            href="/blog"
            className="
              inline-flex items-center gap-2
              px-4 py-2 mb-6
              rounded-xl
              text-sm font-semibold text-amber-700
              bg-amber-100/70 backdrop-blur-md
              border border-amber-300
              shadow-[0_0_14px_rgba(255,200,90,0.35)]
              hover:shadow-[0_0_20px_rgba(255,200,90,0.55)]
              hover:bg-amber-100
              transition-all duration-300
            "
          >
            <span className="text-lg leading-none">←</span>
            <span>Back to Blog</span>
          </Link>

          {/* CARD */}
          <article
            className="
              bg-white/70 backdrop-blur-xl
              border border-white/60
              rounded-3xl
              shadow-[0_12px_35px_rgba(0,0,0,0.08)]
              px-8 py-10
              space-y-6
            "
          >
            {/* TITLE */}
            <h1
              className="
                text-3xl md:text-4xl
                font-bold text-gray-900
                leading-tight
              "
            >
              {post.title}
            </h1>

            {/* META */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{toDateLabel(post.created_at)}</span>
            </div>

            {/* THUMBNAIL */}
            {postThumb && (
              <div className="pt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postThumb}
                  alt={post.title}
                  className="
                    w-full
                    rounded-2xl
                    shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                  "
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.dataset.fallback) return;
                    img.src = "/no-image.png";
                    img.dataset.fallback = "1";
                  }}
                />
              </div>
            )}

            {/* CONTENT */}
            <div className="pt-2">
              <div
                className="
                  prose prose-lg max-w-none
                  prose-headings:font-semibold
                  prose-headings:text-gray-900
                  prose-p:text-gray-700
                  prose-a:text-amber-600
                  prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl
                  prose-img:shadow
                "
                dangerouslySetInnerHTML={{
                  __html: post.content ?? "",
                }}
              />
            </div>
          </article>
        </div>

        {/* ============================================================
            RELATED NEWS
        ============================================================ */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tin tức khác</h2>
              <p className="mt-1 text-sm text-gray-600">
                Một số bài viết mới bạn có thể quan tâm.
              </p>
            </div>

            <Link
              href="/blog"
              className="
                inline-flex items-center justify-center
                px-4 py-2 rounded-xl
                text-sm font-semibold
                text-gray-900
                bg-white/70 backdrop-blur-md
                border border-white/60
                hover:bg-white
                transition
              "
            >
              Xem tất cả
            </Link>
          </div>

          {/* List */}
          <div className="mt-6">
            {loadingRelated ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="
                      rounded-3xl
                      bg-white/50
                      border border-white/60
                      backdrop-blur-xl
                      shadow-[0_10px_30px_rgba(0,0,0,0.06)]
                      overflow-hidden
                    "
                  >
                    <div className="h-40 bg-gray-200/60" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200/70 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200/70 rounded" />
                      <div className="h-8 w-28 bg-gray-200/70 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : related.length === 0 ? (
              <div className="text-gray-600 italic">Chưa có bài viết khác.</div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => {
                  const thumb = resolveThumbUrl(p.thumbnail);
                  return (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="
                        group
                        rounded-3xl
                        bg-white/70 backdrop-blur-xl
                        border border-white/60
                        shadow-[0_12px_35px_rgba(0,0,0,0.08)]
                        overflow-hidden
                        hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]
                        transition
                      "
                    >
                      <div className="relative h-44 bg-gray-100">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={p.title}
                            className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              if (img.dataset.fallback) return;
                              img.src = "/no-image.png";
                              img.dataset.fallback = "1";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                            No image
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                      </div>

                      <div className="p-5">
                        <div className="text-xs text-gray-500">{toDateLabel(p.created_at)}</div>
                        <div className="mt-2 text-lg font-bold text-gray-900 line-clamp-2">
                          {p.title}
                        </div>

                        <div
                          className="
                            mt-4 inline-flex items-center gap-2
                            text-sm font-semibold text-amber-700
                          "
                        >
                          Đọc tiếp <span className="transition group-hover:translate-x-0.5">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
