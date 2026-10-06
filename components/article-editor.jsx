"use client";

import { useEffect, useState } from "react";

export default function ArticleEditor({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", status: "draft", tags: "", coverImage: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        content: initial.content || "",
        excerpt: initial.excerpt || "",
        status: initial.status || "draft",
        tags: (initial.tags || []).join(", "),
        coverImage: initial.coverImage || "",
      });
    } else {
      setForm({ title: "", content: "", excerpt: "", status: "draft", tags: "", coverImage: "" });
    }
    setError("");
  }, [initial, open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.title.trim().length < 3) return setError("Title must be at least 3 characters");
    if (form.content.trim().length < 10) return setError("Content must be at least 10 characters");
    if (form.coverImage && !isValidUrl(form.coverImage)) return setError("Cover image must be a valid URL");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content,
        excerpt: form.excerpt.trim(),
        status: form.status,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
        coverImage: form.coverImage.trim(),
      };
      await onSave(payload);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function isValidUrl(s) {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-full max-w-[640px] bg-[#fdfcfb] border-l border-stone-200 shadow-2xl flex flex-col max-h-screen">
        <div className="px-6 h-[64px] flex items-center justify-between border-b border-stone-200 shrink-0">
          <div>
            <div className="text-[11px] tracking-[0.14em] uppercase text-stone-500 font-medium">{initial ? "Edit story" : "New story"}</div>
            <div className="font-[650] tracking-[-0.02em] text-[18px] -mt-1">{initial ? "Refine your article" : "Write something memorable"}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-stone-200 bg-white grid place-items-center hover:bg-stone-50">✕</button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-auto p-6 space-y-5">
          <div>
            <label className="text-[13px] font-medium tracking-[-0.01em]">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="The quiet power of a good sentence"
              className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-[15px]"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium">Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="culture, essays, notes"
                className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium">Cover image URL (optional)</label>
            <input
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 text-sm"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium">Excerpt (optional, auto-generated if empty)</label>
            <input
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="A single line that earns the click"
              className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 text-sm"
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-[13px] font-medium">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Begin writing…"
              rows={14}
              className="mt-1.5 w-full p-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-[14px] leading-6 resize-none"
              maxLength={50000}
            />
            <div className="mt-1 text-right text-[11px] text-stone-400">{form.content.length} / 50,000</div>
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 px-5 rounded-full border border-stone-200 bg-white text-sm font-medium hover:bg-stone-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Publish story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
