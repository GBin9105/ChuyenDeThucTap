"use client";

import { useState, useEffect, useRef } from "react";

export default function BannerSlider() {
  const [banners, setBanners] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // ============================
  // FETCH BANNERS
  // ============================
  useEffect(() => {
    fetch("http://localhost:8000/api/banners")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const active = list
          .filter((b: any) => b.status === 1)
          .map((b: any) => b.image);

        setBanners(active);
      })
      .catch(() => setBanners([]));
  }, []);

  // ============================
  // AUTO SLIDE WITH RESET
  // ============================
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
  };

  useEffect(() => {
    if (banners.length > 1) startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners]);

  // ============================
  // NEXT / PREV
  // ============================
  const nextSlide = () => {
    setIndex((i) => (i + 1) % banners.length);
    startTimer();
  };

  const prevSlide = () => {
    setIndex((i) => (i - 1 + banners.length) % banners.length);
    startTimer();
  };

  // ============================
  // TOUCH HANDLERS
  // ============================
  const onTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: any) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
  };

  return (
    <div
      className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-xl select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* LOADING */}
      {banners.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
          Loading banners...
        </div>
      ) : (
        <img
          src={banners[index]}
          alt="Banner"
          className="w-full h-full object-cover transition-all duration-700"
        />
      )}

      {/* PREV BUTTON */}
      {banners.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition"
        >
          ←
        </button>
      )}

      {/* NEXT BUTTON */}
      {banners.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition"
        >
          →
        </button>
      )}

      {/* DOTS */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 w-full flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                startTimer();
              }}
              className={`rounded-full transition-all ${
                i === index ? "w-6 h-3 bg-white" : "w-3 h-3 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
