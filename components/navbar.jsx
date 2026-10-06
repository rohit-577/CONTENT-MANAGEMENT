"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, clearAuth } from "@/lib/client-auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logout() {
    clearAuth();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-[14px] bg-[#fdfcfb]/80 border-b border-stone-200">
      <div className="mx-auto max-w-[1160px] px-6 h-[64px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-[9px] bg-zinc-900 text-white grid place-items-center font-mono text-[13px] tracking-[-0.02em]">I</div>
          <div className="leading-none">
            <div className="font-[650] tracking-[-0.03em] text-[17px] group-hover:tracking-[-0.02em] transition-all">Inkwell</div>
            <div className="text-[11px] tracking-[0.14em] uppercase text-stone-500 font-medium -mt-[1px]">Editorial CMS</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-2 text-sm mr-1">
                <span className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 grid place-items-center text-[12px] font-medium">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="text-stone-700 hidden lg:inline">{user.name}</span>
                <span className={`ml-1 px-2 py-[2px] rounded-full text-[11px] font-medium border ${user.role === "Admin" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-stone-200 text-stone-600"}`}>
                  {user.role}
                </span>
              </span>
              <Link
                href="/dashboard"
                className="px-4 h-9 inline-flex items-center rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 h-9 inline-flex items-center rounded-full border border-stone-200 bg-white text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 h-9 inline-flex items-center rounded-full border border-stone-200 bg-white text-sm font-medium hover:bg-stone-50 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="px-5 h-9 inline-flex items-center rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
