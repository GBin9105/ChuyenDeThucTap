export default function Pagination({ page, totalPages }: any) {
  return (
    <div className="flex justify-center gap-3 mt-8">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          className={`
            px-4 py-2 rounded-lg border 
            ${i + 1 === page ? "bg-blue-600 text-white shadow" : "bg-white/70"}
          `}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
