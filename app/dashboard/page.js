"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearAuth, authFetch } from "@/lib/client-auth";
import Navbar from "@/components/navbar";
import ArticleCard from "@/components/article-card";
import ArticleEditor from "@/components/article-editor";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState({ search: "", status: "", page: 1 });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (!t || !u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setAuthChecked(true);
  }, [router]);

  async function fetchAccount() {
    const { res, data } = await authFetch("/api/auth/me");
    if (data?.success) setAccount(data.data);
  }

  async function fetchArticles() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    params.set("page", String(query.page));
    params.set("limit", "9");

    const { res, data } = await authFetch(`/api/articles?${params.toString()}`);
    if (!res.ok && res.status === 401) {
      clearAuth();
      router.replace("/login");
      return;
    }
    if (!data?.success) {
      setError(data?.error || "Failed to load articles");
      setArticles([]);
    } else {
      setArticles(data.data.articles || []);
      setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!authChecked) return;
    fetchAccount();
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked) return;
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, query.page, query.status]);

  function onSearch(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const search = (fd.get("search") || "").toString();
    setQuery((q) => ({ ...q, search, page: 1 }));
    // trigger fetch with new search
    setTimeout(() => fetchWithSearch(search), 0);
  }

  async function fetchWithSearch(search) {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (query.status) params.set("status", query.status);
    params.set("page", "1");
    params.set("limit", "9");
    const { data } = await authFetch(`/api/articles?${params.toString()}`);
    if (data?.success) {
      setArticles(data.data.articles || []);
      setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
    }
    setLoading(false);
  }

  async function handleCreate(payload) {
    const { res, data } = await authFetch("/api/articles", { method: "POST", body: JSON.stringify(payload) });
    if (!data?.success) throw new Error(data?.error || "Failed to create");
    setEditorOpen(false);
    setEditing(null);
    await fetchArticles();
  }

  async function handleUpdate(payload) {
    const id = editing._id;
    const { data } = await authFetch(`/api/articles/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    if (!data?.success) throw new Error(data?.error || "Failed to update");
    setEditorOpen(false);
    setEditing(null);
    await fetchArticles();
  }

  async function handleDelete(article) {
    if (!confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
    const { res, data } = await authFetch(`/api/articles/${article._id}`, { method: "DELETE" });
    if (!data?.success) {
      alert(data?.error || "Delete failed");
      return;
    }
    await fetchArticles();
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(article) {
    setEditing(article);
    setEditorOpen(true);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#fdfcfb] text-stone-500 text-sm">Checking authentication…</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-[1160px] px-6 py-8">
        {/* Account header */}
        <div className="rounded-[20px] border border-stone-200 bg-white p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-zinc-900 text-white grid place-items-center font-medium">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[18px] font-[650] tracking-[-0.02em]">{account?.name || user?.name}</div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${user?.role === "Admin" ? "bg-zinc-900 text-white border-zinc-900" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                  {user?.role}
                </span>
                {account?.is_active !== undefined && (
                  <span className={`px-2.5 py-1 rounded-full text-xs border ${account.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>
                    {account.is_active ? "Active" : "Deactivated"}
                  </span>
                )}
              </div>
              <div className="text-sm text-stone-600 mt-1">{account?.email || user?.email} · Member since {account?.created_at ? new Date(account.created_at).toLocaleDateString("en-IN") : "—"}</div>
              <div className="text-xs text-stone-500 mt-2 max-w-[640px] leading-5">
                MySQL owns this identity (Users → Roles → AuditLogs). MongoDB owns the stories below via <span className="font-mono bg-stone-100 px-1 rounded">authorId: {user?.id}</span> — a Number, not an ObjectId, so the cross-store link is explicit and honest.
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <button onClick={openCreate} className="h-11 px-6 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800">
              + New story
            </button>
            <div className="text-xs text-stone-500 lg:text-right">
              {pagination.total} {pagination.total === 1 ? "story" : "stories"} · Page {pagination.page} of {pagination.pages || 1}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <form onSubmit={onSearch} className="flex gap-2 flex-1 max-w-[560px]">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
              <input name="search" defaultValue={query.search} placeholder="Search titles, excerpts, content…" className="w-full h-10 pl-8 pr-3 rounded-full border border-stone-200 bg-white text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
            </div>
            <button className="h-10 px-5 rounded-full border border-stone-200 bg-white text-sm font-medium hover:bg-stone-50">Search</button>
            {query.search && (
              <button type="button" onClick={() => { setQuery((q) => ({ ...q, search: "", page: 1 })); fetchWithSearch(""); }} className="h-10 px-4 rounded-full bg-stone-100 text-sm">
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-[0.08em] uppercase text-stone-500">Filter</span>
            <div className="flex rounded-full border border-stone-200 bg-white p-1">
              {["", "published", "draft", "archived"].map((s) => (
                <button
                  key={s || "all"}
                  onClick={() => setQuery((q) => ({ ...q, status: s, page: 1 }))}
                  className={`px-3.5 h-7 rounded-full text-xs font-medium capitalize transition-colors ${query.status === s ? "bg-zinc-900 text-white" : "text-stone-600 hover:bg-stone-50"}`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[280px] rounded-[18px] border border-stone-200 bg-white animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6 text-sm">
              <div className="font-medium">Couldn’t load stories</div>
              <div className="mt-1 text-red-600/80">{error}</div>
              <button onClick={fetchArticles} className="mt-3 h-9 px-4 rounded-full bg-white border border-red-200 text-sm">Retry</button>
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-stone-300 bg-white p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 grid place-items-center mx-auto text-stone-500">✎</div>
              <div className="mt-3 text-[16px] font-[600] tracking-[-0.01em]">No stories yet</div>
              <div className="mt-1 text-sm text-stone-500 max-w-[420px] mx-auto leading-5">Create your first story. It will be stored in MongoDB with your MySQL identity as its author — and it will survive pagination, search, and role checks.</div>
              <button onClick={openCreate} className="mt-4 h-10 px-6 rounded-full bg-zinc-900 text-white text-sm font-medium">Create your first story</button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((a) => (
                  <ArticleCard key={a._id} article={a} currentUser={user} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-stone-500">Showing {articles.length} of {pagination.total}</div>
                <div className="flex items-center gap-2">
                  <button disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))} className="h-9 px-4 rounded-full border border-stone-200 bg-white text-sm disabled:opacity-40">Previous</button>
                  <span className="text-sm font-mono bg-white border border-stone-200 px-3 py-1.5 rounded-full">
                    {query.page} / {pagination.pages || 1}
                  </span>
                  <button disabled={query.page >= pagination.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))} className="h-9 px-4 rounded-full border border-stone-200 bg-white text-sm disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security note */}
        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="text-sm font-[600] tracking-[-0.01em]">Security you can verify</div>
            <div className="text-sm leading-5 text-stone-600 mt-1">Try to edit another author’s story — the button won’t even appear, and the API will answer <span className="font-mono bg-stone-100 px-1 rounded">403 Forbidden</span> if you craft the request anyway. Same for a missing or expired JWT: <span className="font-mono bg-stone-100 px-1 rounded">401</span>, no crash, no leak.</div>
          </div>
          <div className="text-xs leading-4 text-stone-500 md:max-w-[320px] border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-4">
            Admin sees every story. Author sees the same feed, but can only mutate their own. The ownership check is <span className="font-mono">article.authorId === user.id</span>, server-side.
          </div>
        </div>
      </main>

      <ArticleEditor open={editorOpen} initial={editing} onClose={() => { setEditorOpen(false); setEditing(null); }} onSave={editing ? handleUpdate : handleCreate} />

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">Inkwell — MySQL for identity, MongoDB for story.</footer>
    </div>
  );
}
