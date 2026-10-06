"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/client-auth";
import Navbar from "@/components/navbar";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Author" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("All fields are required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = data.details ? `${data.error} — ${JSON.stringify(data.details)}` : data.error;
        setError(msg || "Registration failed");
        return;
      }
      setAuth(data.data.token, data.data.user);
      router.push("/dashboard");
    } catch {
      setError("Network error. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:flex flex-col justify-between border-r border-stone-200 bg-zinc-900 text-stone-100 p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">● Two roles, one craft</div>
            <h1 className="mt-6 text-[38px] font-[700] leading-[0.95] tracking-[-0.03em]">Start your</h1>
            <h1 className="text-[38px] font-serif italic font-[400] leading-[0.95] tracking-[-0.02em] text-stone-300">editorial archive.</h1>
            <p className="mt-4 max-w-[440px] text-[15px] leading-6 text-stone-300">
              Register once. The stored procedure <span className="font-mono text-white">CreateUserWithRole</span> validates you, the trigger audits you, and the index finds you in milliseconds.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-[440px]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-medium text-white">Admin</div>
                <div className="text-xs leading-4 text-stone-400 mt-1">Manages users and every story. Sees all, edits all.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-medium text-white">Author</div>
                <div className="text-xs leading-4 text-stone-400 mt-1">Creates and owns stories. Can only edit their own.</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-stone-500">MySQL: Users/Roles/AuditLogs · MongoDB: Articles · Zod · JWT</div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10 bg-[#fdfcfb]">
          <form onSubmit={onSubmit} className="w-full max-w-[440px] bg-white border border-stone-200 rounded-[20px] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] tracking-[0.14em] uppercase font-medium text-stone-500">Inkwell — create account</div>
            <h2 className="mt-1 text-[22px] font-[680] tracking-[-0.02em]">Create your account</h2>
            <p className="text-sm text-stone-500 mt-1">Choose your role honestly. You can’t escalate it from the UI.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[13px] font-medium">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="A. R. Writer"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@inkwell.local"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm"
                  autoComplete="email"
                />
                <div className="mt-1 text-xs text-stone-500">Indexed with <span className="font-mono bg-stone-100 px-1 rounded">idx_users_email</span> for fast lookup.</div>
              </div>
              <div>
                <label className="text-[13px] font-medium">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm"
                  autoComplete="new-password"
                />
                <div className="mt-1 text-xs text-stone-500">Hashed with bcrypt (10 rounds) before it ever touches MySQL.</div>
              </div>
              <div>
                <label className="text-[13px] font-medium">Role</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {["Author", "Admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`h-11 rounded-xl border text-sm font-medium transition-colors ${form.role === r ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5">{error}</div>}

            <button type="submit" disabled={loading} className="mt-6 w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60">
              {loading ? "Creating account…" : "Create account"}
            </button>

            <div className="mt-4 text-center text-sm text-stone-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-4 decoration-stone-300 hover:decoration-zinc-900">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
