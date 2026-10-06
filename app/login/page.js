"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/client-auth";
import Navbar from "@/components/navbar";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Email and password are required");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Login failed");
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
        <div className="hidden lg:flex flex-col justify-between border-r border-stone-200 bg-white p-10">
          <div>
            <div className="text-[11px] tracking-[0.16em] uppercase font-medium text-stone-500">Welcome back</div>
            <h1 className="mt-3 text-[36px] font-[700] leading-[0.95] tracking-[-0.03em]">Sign in to</h1>
            <h1 className="text-[36px] font-serif italic font-[400] leading-[0.95] tracking-[-0.02em] text-stone-600">continue writing.</h1>
            <p className="mt-4 max-w-[420px] text-[15px] leading-6 text-stone-600">
              Your words are waiting in MongoDB. Your identity is safe in MySQL. One password, two databases, zero friction.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-5 text-stone-600">
            <div className="font-medium text-stone-900">Tip for evaluators</div>
            <div className="mt-1">Try both roles — <span className="font-medium">Admin</span> can edit anyone’s story. <span className="font-medium">Author</span> can only touch their own. The API enforces it.</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10 bg-[#fdfcfb]">
          <form onSubmit={onSubmit} className="w-full max-w-[420px] bg-white border border-stone-200 rounded-[20px] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] tracking-[0.14em] uppercase font-medium text-stone-500">Inkwell — sign in</div>
            <h2 className="mt-1 text-[22px] font-[680] tracking-[-0.02em]">Welcome back</h2>
            <p className="text-sm text-stone-500 mt-1">Use the account you registered with. No demo logins.</p>

            <div className="mt-6 space-y-4">
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
              </div>
              <div>
                <label className="text-[13px] font-medium">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-stone-200 bg-white outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="mt-4 text-center text-sm text-stone-600">
              New to Inkwell?{" "}
              <Link href="/register" className="font-medium text-zinc-900 underline underline-offset-4 decoration-stone-300 hover:decoration-zinc-900">
                Create an account
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-stone-100 text-xs leading-4 text-stone-500">
              On success we store a JWT (id, email, role) and redirect to <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">/dashboard</span>. Every API call after that carries{" "}
              <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">Authorization: Bearer …</span>.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
