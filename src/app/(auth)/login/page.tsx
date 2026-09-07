"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Receipt } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
        <Receipt className="h-5 w-5" />
      </span>
      <span className="text-lg font-black tracking-tight text-white">Billing ERP</span>
    </span>
  );
}

function LoginForm() {
  useDocumentTitle("Login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("Unable to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#020d1f] text-white">
      <div className="flex min-h-screen w-full overflow-hidden bg-[linear-gradient(90deg,#050f1d_0%,#071b2d_42%,#081b2f_100%)]">
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#1a2d43] bg-[#021321]/90 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2ba9ff] to-[#0d6efd] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Billing ERP</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1425] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#101d30]"
          >
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="relative mx-auto w-full max-w-[1700px] pt-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
          </div>

          <div className="relative grid min-h-[calc(100vh-64px)] w-full lg:grid-cols-[1.08fr_0.92fr]">
            <div className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(43,124,194,0.18),_transparent_35%),linear-gradient(90deg,rgba(9,24,39,0.97),rgba(10,26,42,0.96))] px-8 pb-8 pt-6 sm:px-10 sm:pb-10 lg:px-14 lg:pb-12 lg:pt-8">
              <div className="max-w-[500px]">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#4dc5ff]/40 bg-[#0f243a]/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#7fe7ff]">
                  <span className="h-2 w-2 rounded-full bg-[#6fe3ff]" />
                  ERP PLATFORM
                </div>

                <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[72px] lg:leading-[0.96]">
                  One system for your
                  <span className="block">entire business.</span>
                </h1>

                <p className="mt-6 max-w-[420px] text-lg leading-8 text-slate-300">
                  Manage invoicing, stock, payments, expenses, CRM, payroll,
                  and reporting from a single secure workspace.
                </p>
              </div>

              <div className="mt-10 max-w-[500px] rounded-2xl border border-white/10 bg-[#0d1d2e]/80 px-4 py-3 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1ddf9e]/10 text-[#47e1b6]">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0L3.3 9.8A1 1 0 1 1 4.7 8.4l4.3 4.3 6.6-6.6a1 1 0 0 1 1.4 0Z" />
                    </svg>
                  </span>
                  GST-ready billing workflows
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center border-l border-[#173553] bg-[radial-gradient(circle_at_top,_rgba(22,41,61,0.8),_rgba(4,14,23,0.98)_60%)] px-6 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-8">
              <div className="w-full max-w-[430px] rounded-[30px] border border-[#1d3553] bg-[#071b2d]/90 p-6 shadow-[0_25px_45px_rgba(0,0,0,0.28)] sm:p-8">
                <div className="mb-8 flex flex-col items-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2ba9ff] to-[#0d6efd] shadow-[0_0_24px_rgba(59,130,246,0.5)]">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-black tracking-[-0.04em] text-white">Welcome back</h2>
                  <p className="mt-2 text-base text-slate-400">Sign in to manage your business</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Email / Username"
                    type="text"
                    name="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    labelClassName="text-slate-200 text-base"
                    className="h-14 border border-slate-600 bg-[#0b1b2d] text-base text-white placeholder:text-slate-500 focus:border-[#4ec7ff] focus:ring-2 focus:ring-[#4ec7ff]/30"
                  />
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    labelClassName="text-slate-200 text-base"
                    className="h-14 border border-slate-600 bg-[#0b1b2d] text-base text-white placeholder:text-slate-500 focus:border-[#4ec7ff] focus:ring-2 focus:ring-[#4ec7ff]/30"
                  />

                  <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-800 accent-[#2ba9ff]"
                      />
                      Remember me
                    </label>
                    <button type="button" className="font-medium text-[#62d7ff] hover:text-[#8fe5ff]">
                      Forgot Password?
                    </button>
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2ba9ff] to-[#0d73ff] text-base font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)]" loading={loading}>
                    Login
                  </Button>
                </form>

                <div className="mt-7 rounded-2xl border border-[#2eb8ff]/25 bg-[#0b1b2d]/80 p-4">
                  <p className="mb-3 text-lg font-bold text-white">Demo Login Credentials</p>
                  <div className="space-y-2 text-sm">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => fillDemoCredentials("admin@business.local", "Admin@123")}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a1526] px-3 py-2 text-left text-slate-200 transition hover:bg-[#0e1e31]"
                    >
                      <span className="font-semibold text-white">Admin</span>
                      <span className="text-slate-400">admin@business.local / Admin@123</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => fillDemoCredentials("cashier@business.local", "Cashier@123")}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a1526] px-3 py-2 text-left text-slate-200 transition hover:bg-[#0e1e31]"
                    >
                      <span className="font-semibold text-white">Cashier</span>
                      <span className="text-slate-400">cashier@business.local / Cashier@123</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
