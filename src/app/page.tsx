import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Contact,
  Factory,
  FileSpreadsheet,
  Package,
  Percent,
  Receipt,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Billing ERP — Smart Billing & Business Operations Platform",
  description:
    "Modern ERP platform for billing, inventory, accounting, payments, CRM, HR, and manufacturing — built for growth-focused businesses.",
  robots: { index: true, follow: true },
};

const MODULES = [
  {
    icon: Receipt,
    title: "Smart Billing",
    description: "GST-ready invoices, returns, instant totals, and print-ready documents that look premium and work fast.",
  },
  {
    icon: Warehouse,
    title: "Inventory Control",
    description: "Track stock in real time, avoid shortages, and maintain an auditable stock ledger with every movement.",
  },
  {
    icon: Wallet,
    title: "Payments & Expenses",
    description: "Handle receipts, payments, and expenses in one place with clean cash-flow visibility across the business.",
  },
  {
    icon: Users,
    title: "Customers & Suppliers",
    description: "Create master records, manage outstanding balances, and monitor party health with complete transaction history.",
  },
  {
    icon: BarChart3,
    title: "Dashboards & Reports",
    description: "See live sales, profits, payment status, and operational insights through actionable reports and charts.",
  },
  {
    icon: Contact,
    title: "CRM Pipeline",
    description: "Track leads, follow-ups, and deal movement with a structured pipeline built for sales teams.",
  },
  {
    icon: UserCog,
    title: "HR & Payroll",
    description: "Manage employee records, attendance, and payroll processing with role-based operational control.",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    description: "Connect BOMs, production orders, and finished stock flow to create a reliable production process.",
  },
  {
    icon: Package,
    title: "Purchase Workflows",
    description: "Streamline purchase entries, stock updates, and supplier payments while keeping all records connected.",
  },
];

const STATS = [
  { label: "Businesses managed", value: "2.5K+" },
  { label: "Avg. time saved", value: "40%" },
  { label: "Transactions logged", value: "1.2M" },
  { label: "Live sync uptime", value: "99.9%" },
];

const HIGHLIGHTS = [
  { icon: Percent, label: "GST-friendly design" },
  { icon: ShieldCheck, label: "Role-based security" },
  { icon: FileSpreadsheet, label: "Excel import & export" },
  { icon: CircleDollarSign, label: "Cash flow clarity" },
];

const WHY_US = [
  "One integrated platform for billing, inventory, accounting, HR, CRM, and manufacturing operations.",
  "Faster decision-making with live dashboards, stock visibility, and out-of-the-box analytics.",
  "Secure and role-aware access so every action follows your business rules and permissions.",
  "Simple workflows for operations teams, finance teams, and business owners — all in one place.",
];

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
        <Receipt className="h-5 w-5" />
      </span>
      <span className="text-lg font-black tracking-tight text-slate-900">Billing ERP</span>
    </span>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="landing-shell min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-pattern" />
        <div className="orb orb-blue" />
        <div className="orb orb-cyan" />
        <div className="orb orb-violet" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <BrandMark className="text-white" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#modules" className="transition-colors hover:text-white">Modules</a>
            <a href="#why-us" className="transition-colors hover:text-white">Why us</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-cyan-400/50 hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                ERP for modern business
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
                Build a sharper,
                <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  smarter business.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Manage billing, inventory, sales, purchases, expenses, payments, CRM, HR, and production from one elegant system designed to move fast.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
                >
                  Explore platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  View modules
                </a>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
                {STATS.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="text-xl font-black text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="glass-panel float-card animate-float">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                    live
                  </span>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sales", value: "₹48.3K", tone: "text-emerald-300" },
                      { label: "Profit", value: "₹12.4K", tone: "text-cyan-300" },
                      { label: "Due", value: "₹8.2K", tone: "text-amber-300" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{kpi.label}</div>
                        <div className={`mt-2 text-base font-bold ${kpi.tone}`}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Performance</span>
                      <TrendingUp className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[26, 38, 34, 58, 46, 72, 86, 68].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 to-blue-400"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Invoice #INV-0248 created successfully",
                      "Stock updated — 18 units sold",
                      "Payment received from Premium Retail",
                    ].map((item, idx) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${idx === 0 ? "bg-cyan-300" : idx === 1 ? "bg-violet-300" : "bg-emerald-300"}`} />
                        <span className="text-sm text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -left-8 top-8 rounded-2xl border border-cyan-400/30 bg-slate-900/80 px-4 py-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-md animate-float-delayed">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Today</div>
                <div className="mt-1 text-xl font-black text-white">₹1.2L</div>
              </div>

              <div className="absolute -bottom-6 right-6 rounded-2xl border border-violet-400/30 bg-slate-900/80 px-4 py-3 shadow-2xl shadow-violet-950/40 backdrop-blur-md animate-float-delayed-lg">
                <div className="flex items-center gap-2 text-sm text-violet-200">
                  <ShieldCheck className="h-4 w-4" />
                  Secure system
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-cyan-400/40 hover:bg-white/7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-base font-semibold text-white">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="modules" className="border-t border-white/10 bg-slate-900/50 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Core modules</p>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Everything your business needs, in one place.</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {MODULES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="group rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/80">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-200 ring-1 ring-cyan-400/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Why choose us</p>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Built for operations, not just admin.</h2>
            </div>

            <div className="space-y-4">
              {WHY_US.map((point) => (
                <div key={point} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-base leading-7 text-slate-200">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 py-20">
          <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to run your business with clarity?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              From invoice generation to stock accuracy, your team can manage every critical detail in one connected platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Login to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
