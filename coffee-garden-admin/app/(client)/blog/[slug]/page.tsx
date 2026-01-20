"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type Post = {
    title: string;
    thumbnail: string | null;
    content: string | null;
    created_at: string;
};

export default function BlogDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    /* ============================================================
       LOAD POST BY SLUG
    ============================================================ */
    useEffect(() => {
        if (!slug) return;

        fetch(`http://localhost:8000/api/posts/${slug}`, {
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

            <main className="max-w-3xl mx-auto px-6 py-14">
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
                        <span>
                            {new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {/* THUMBNAIL */}
                    {post.thumbnail && (
                        <div className="pt-4">
                            <img
                                src={
                                    post.thumbnail.startsWith("http")
                                        ? post.thumbnail
                                        : `http://localhost:8000/${post.thumbnail}`
                                }
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
            </main>

            <Footer />
        </>
    );
}
