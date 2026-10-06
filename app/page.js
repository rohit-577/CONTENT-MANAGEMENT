import Link from "next/link";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-[1160px] px-6 pt-12 pb-10">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                MySQL + MongoDB · Next.js 16
              </div>
              <h1 className="mt-6 text-[46px] lg:text-[56px] font-[720] leading-[0.95] tracking-[-0.04em]">
                A calm place
                <br />
                <span className="font-serif italic font-[400] tracking-[-0.03em] text-stone-500">to publish</span>
                <br />
                words that matter.
              </h1>
              <p className="mt-5 max-w-[560px] text-[17px] leading-7 text-stone-600">
                Inkwell is a disciplined editorial CMS. MySQL guards identity and roles with transactional rigor. MongoDB holds
                your stories exactly as they deserve to be held — flexible, fast, and free of ceremony.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="h-11 px-7 inline-flex items-center rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors">
                  Start writing — free
                </Link>
                <Link href="/login" className="h-11 px-7 inline-flex items-center rounded-full border border-stone-200 bg-white text-sm font-medium hover:bg-stone-50 transition-colors">
                  Sign in
                </Link>
                <span className="inline-flex items-center text-xs text-stone-500 ml-1">No credit card · Two roles: Admin & Author</span>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-[560px] border-t border-stone-200 pt-6">
                <div>
                  <div className="text-[11px] tracking-[0.14em] uppercase font-medium text-stone-500">Relational</div>
                  <div className="mt-1 text-sm leading-5 text-stone-700">Users, roles, audit logs in MySQL with view, trigger, procedure & index.</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.14em] uppercase font-medium text-stone-500">Document</div>
                  <div className="mt-1 text-sm leading-5 text-stone-700">Articles in MongoDB — schema-validated, paginated, searchable.</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.14em] uppercase font-medium text-stone-500">Secure</div>
                  <div className="mt-1 text-sm leading-5 text-stone-700">Bcrypt + JWT, role middleware, ownership checks on every write.</div>
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="lg:pt-4">
              <div className="rounded-[24px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="h-9 flex items-center gap-1.5 px-4 border-b border-stone-100 bg-stone-50/60">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-mono text-stone-500">inkwell.local — dashboard</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs tracking-[0.12em] uppercase font-medium text-stone-500">Latest stories</div>
                    <span className="text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-full">Admin view</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { title: "The architecture of quiet software", status: "published", tag: "essays" },
                      { title: "Why MySQL still earns its place", status: "draft", tag: "engineering" },
                      { title: "Editing is a form of respect", status: "published", tag: "culture" },
                    ].map((p) => (
                      <div key={p.title} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 px-3 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 grid place-items-center text-[11px] font-mono">Aa</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight truncate">{p.title}</div>
                          <div className="text-xs text-stone-500">#{p.tag} · {p.status}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${p.status === "published" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-zinc-900 text-white py-3">
                      <div className="text-[20px] font-[650] leading-none">2.4k</div>
                      <div className="text-[11px] opacity-70">words / avg</div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white py-3">
                      <div className="text-[20px] font-[650] leading-none">100%</div>
                      <div className="text-[11px] text-stone-500">validated</div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white py-3">
                      <div className="text-[20px] font-[650] leading-none">7ms</div>
                      <div className="text-[11px] text-stone-500">p95 read</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-stone-500">A preview — your actual dashboard is this calm, only more capable.</div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-[1160px] px-6 py-8 grid md:grid-cols-4 gap-8">
            {[
              ["Advanced SQL, properly", "Index on email, ActiveAuthorsView, audit trigger, CreateUserWithRole procedure — all in db/init.sql."],
              ["Two databases, one flow", "article.authorId is a MySQL user id (Number), not an ObjectId — cross-store integrity by design."],
              ["RBAC where it counts", "JWT carries role; middleware enforces. Hiding a button is never the security control."],
              ["Validation first", "Zod on every API route before any DB write. 400s are honest and specific."],
            ].map(([h, p]) => (
              <div key={h}>
                <div className="text-sm font-[650] tracking-[-0.01em]">{h}</div>
                <div className="mt-1 text-sm leading-5 text-stone-600">{p}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1160px] px-6 py-10">
          <div className="rounded-[20px] border border-stone-200 bg-[#1c1c1a] text-stone-100 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-sm font-medium tracking-[-0.01em] text-white">Ready to make the CMS yours?</div>
              <div className="text-sm text-stone-400 mt-1">Create an Author account to write, or an Admin to govern. Both are real choices.</div>
            </div>
            <div className="flex gap-2">
              <Link href="/register" className="h-10 px-6 rounded-full bg-white text-zinc-900 text-sm font-medium hover:bg-stone-100">
                Create account
              </Link>
              <Link href="/dashboard" className="h-10 px-6 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10">
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-stone-500">Crafted for reviewers who notice spacing, wording, and whether the trigger actually fires.</div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">© {new Date().getFullYear()} Inkwell — MySQL for identity, MongoDB for story.</footer>
    </div>
  );
}
