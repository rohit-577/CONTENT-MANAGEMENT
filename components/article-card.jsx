"use client";

export default function ArticleCard({ article, currentUser, onEdit, onDelete }) {
  const canModify = currentUser && (currentUser.role === "Admin" || currentUser.id === article.authorId);
  const date = new Date(article.createdAt || article.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group bg-white border border-stone-200 rounded-[18px] overflow-hidden hover:border-stone-300 transition-colors flex flex-col">
      {article.coverImage ? (
        <div className="h-[168px] overflow-hidden bg-stone-100">
          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
      ) : (
        <div className="h-[8px] bg-gradient-to-r from-zinc-900 via-stone-700 to-stone-300" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-[11px] tracking-wide">
          <span className={`px-2 py-1 rounded-full font-medium border capitalize ${article.status === "published" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : article.status === "archived" ? "bg-stone-100 border-stone-200 text-stone-600" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {article.status}
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-500">{date}</span>
          {article.readTime ? <><span className="text-stone-300">•</span><span className="text-stone-500">{article.readTime} min</span></> : null}
        </div>

        <h3 className="mt-3 text-[18px] font-[650] leading-[1.25] tracking-[-0.02em] line-clamp-2">{article.title}</h3>
        <p className="mt-2 text-[14px] leading-6 text-stone-600 line-clamp-3">{article.excerpt || article.content?.slice(0, 160)}</p>

        {article.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <span key={t} className="px-2 py-1 rounded-full bg-stone-50 border border-stone-200 text-[11px] text-stone-600">#{t}</span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white grid place-items-center text-[11px] font-medium">
              {(article.authorName || "A")[0].toUpperCase()}
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-medium tracking-[-0.01em]">{article.authorName || `Author #${article.authorId}`}</div>
              <div className="text-[11px] text-stone-500">{article.authorEmail || ""}</div>
            </div>
          </div>
          {canModify && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => onEdit(article)} className="h-8 px-3 rounded-full border border-stone-200 bg-white text-xs font-medium hover:bg-stone-50 transition-colors">
                Edit
              </button>
              <button onClick={() => onDelete(article)} className="h-8 px-3 rounded-full bg-white border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
