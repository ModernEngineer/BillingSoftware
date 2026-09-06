# Billing ERP

Full ERP system: Billing / Inventory / Accounting (the original spec) plus CRM, HR & Payroll,
and Manufacturing. **Two-project architecture**: Next.js (App Router) + TypeScript + Tailwind CSS
frontend, and a separate **.NET Core Web API + SQL Server backend** (`backend/BillingErp.Api`).
This is a migration from an earlier single-codebase version (Next.js API routes + Prisma +
SQLite) — that version is archived at `~/billing-software-archive/` (outside this repo) for
reference; it is not part of the running app anymore.

> **Read `AGENTS.md` first.** This Next.js version (16.3.4) has changes that can diverge from an
> LLM's training data — verify against installed versions / actual behavior rather than assuming
> from memory. The same caution applies to whatever .NET SDK is installed (currently .NET 10).

## Running it

Two processes, both required:

```bash
# Terminal 1 — backend (SQL Server Express instance ".\SQLEXPRESS", database BillingErpDb)
cd backend/BillingErp.Api
dotnet ef database update      # only needed after an entity/migration change
ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls "http://localhost:5215"
# ^ on startup this also applies every Data/StoredProcedures/*.sql file and reseeds base data —
#   both steps are idempotent, safe to run every time.

# Terminal 2 — frontend
npm install
npm run dev                    # http://localhost:3000, proxies /api/* to the backend above
```

`next.config.ts`'s `rewrites()` proxies every `/api/*` call from the browser straight through to
the backend (`BACKEND_URL` env var, default `http://localhost:5215`) — the browser only ever talks
to the Next.js origin, so no CORS setup is needed and the `billing_session` cookie flows through
untouched in both directions.

Other useful commands: `npm run lint`, `npx tsc --noEmit` (frontend); `dotnet build`,
`dotnet ef migrations add <Name>` (backend, run from `backend/BillingErp.Api`).

**Seeded logins** (from `Data/DbSeeder.cs`, applied automatically on backend startup):
- `admin@business.local` / `Admin@123` — ADMIN (full access)
- `cashier@business.local` / `Cashier@123` — CASHIER (limited nav, per the Roles matrix)

## Architecture

- **Two separate processes, one browser-visible origin**: the Next.js dev/prod server is what the
  browser talks to; it transparently proxies `/api/*` to the .NET backend via `rewrites()`. Server
  Components that need data directly (not through client-side `fetch`) use `src/lib/serverApi.ts`,
  which calls the backend directly (bypassing the proxy, since a Next.js Server Component has no
  browser "current origin" to resolve a relative URL against) and manually forwards the
  `billing_session` cookie so `[RequirePermission]` still applies.
- **Auth**: custom JWT (via `jose` on the Next.js side, `System.IdentityModel.Tokens.Jwt` on the
  .NET side), HS256, shared secret (`JWT_SECRET` in `.env` / `Jwt:Secret` in the backend's
  `appsettings.Development.json` — **must stay identical on both sides**). The token's claims are a
  flat `{ userId, name, email, roleId, roleName, iat, exp }` shape (`src/types/auth.ts`'s
  `SessionPayload` / `Auth/SessionPayload.cs`) — the backend's `TokenService` builds this manually
  rather than via `ClaimsIdentity`/`ClaimTypes.*`, which would otherwise get remapped to long URIs
  by `JwtSecurityTokenHandler`'s default claim-type map and break `jose`'s parsing.
  `src/middleware.ts` (page-route login gate, checks only "is this cookie valid") is unchanged from
  before the migration — it doesn't care which backend issued the token.
- **Server-side permission enforcement**: every backend endpoint has a
  `[RequirePermission("MODULE", "ACTION")]` attribute (`Auth/RequirePermissionAttribute.cs`) that
  checks the caller's role against the `RolePermission` table — this is enforced on the API itself,
  not just nav-level hiding (`Sidebar.tsx`/`MobileNav.tsx` additionally hide nav items the role
  can't use, but that's UX, not the security boundary).
- **Everything goes through stored procedures** — this is the core architectural decision of the
  .NET backend. EF Core (`Data/AppDbContext.cs`, `Data/Entities/*.cs`) is **schema/migrations
  only**; there is no LINQ querying at runtime. Every controller uses Dapper
  (`Data/SqlConnectionFactory.cs`) to call a stored procedure under `Data/StoredProcedures/*.sql`.
  Naming convention: `sp_<Entity>_<Operation>` (e.g. `sp_Product_List`, `sp_Sale_Create`). Each
  `.sql` file is exactly one `CREATE OR ALTER PROCEDURE` statement (no `GO` batches) —
  `Data/SqlScriptRunner.cs` applies every file in that folder on backend startup automatically.
  Partial-update endpoints follow a COALESCE-per-field pattern (see `sp_Product_Update.sql`), with
  an `@XxxProvided BIT` companion parameter for genuinely-nullable columns like `Status` — the one
  known limitation of this pattern is that a nullable column can't be explicitly cleared back to
  `NULL` through these endpoints (only set to a new value or left untouched).
- **Stock ledger**: `StockTransaction` is the single source of truth for "current stock" — never a
  cached counter on `Product`. Every stock-moving action calls `sp_Stock_RecordTransaction` (via
  `Services/StockService.cs`), which locks the product's existing rows
  (`WITH (UPDLOCK, HOLDLOCK)`) and re-derives the running balance from the sum of all prior
  transactions — this row-locking is a deliberate concurrency-safety addition over the original
  SQLite version, which had no equivalent locking.
- **Numbering** (invoice/purchase/payment/etc.): `sp_Numbering_GetNext` (via
  `Services/NumberingService.cs`) locks the single `Business` settings row and increments the
  relevant counter column inside the caller's own transaction — same locking-for-concurrency
  addition as the stock ledger.
- **GST / totals math**: `Services/GstService.cs` (`ComputeInvoiceTotals`, `SplitGst`,
  `AmountInWords`) is a pure C# port of the original `lib/gst.ts`, shared by Sales and Purchase.
  This calculation intentionally stays in C# rather than T-SQL (the stored-procedure rule applies
  to *data access*, not pure arithmetic that touches no tables) — the SP that persists a sale/
  purchase receives the already-computed totals as parameters.
- **Money**: `decimal(18,2)` in SQL Server (upgraded from SQLite's untyped `Float` during the
  migration — a safe, non-breaking type change since JSON still serializes it as a plain number).
- **Audit log**: `Services/AuditService.cs`'s `LogAsync()` (→ `sp_Audit_Log`) is called from most
  mutating endpoints but isn't exhaustive, matching the original's coverage.
- **Backup/Restore** (`/settings/backup`): generic, schema-driven — `sp_Backup_ExportTable`/
  `sp_Backup_ClearTable`/`sp_Backup_ImportTable` use dynamic SQL against a hardcoded table
  allowlist (never user input) plus `sys.columns` metadata to stay generic across all ~33 tables
  without one hand-written procedure per table. **Verified via a real export→restore round trip**
  in this session (data, password hashes, and identity seeds all survived correctly) — this is
  more thoroughly tested than the original version ever was.

## Data model

`backend/BillingErp.Api/Data/Entities/*.cs` + `AppDbContext.cs` define the schema (SQL Server,
via EF Core migrations under `Data/Migrations/`) — Auth/RBAC, Business settings, Catalog (Category/
Brand/Unit/Product), Customer/Supplier, Sales, Purchase, Payments, Inventory, Expenses, CRM (Lead),
HR (Employee/Attendance/Payroll), Manufacturing (BOMItem/ProductionOrder), plus AuditLog/
Notification — a 1:1 port of the original `prisma/schema.prisma` model shapes. Every FK defaults
to `DeleteBehavior.Restrict` (SQL Server rejects multiple cascade paths); only the specific parent/
child relations the original schema marked `onDelete: Cascade` are configured to cascade.

## What's full-depth vs. lighter-depth

Phases 1–9 of the original build (Dashboard, Products/Categories/Units, Customers/Suppliers +
ledgers, Sales incl. invoice PDF/print/returns, Purchase + returns, Inventory, Payments/Expenses,
all 6 Reports, Users/Roles/Settings, Excel Import) match the original spec's UI in reasonable
depth, and are now all backed by the .NET/SQL Server backend.

CRM, HR & Payroll, and Manufacturing are **functionally complete for one core workflow each**,
deliberately not fleshed out further:
- CRM: Leads list/detail + follow-up activity timeline + pipeline status. No email/calendar
  integration, no lead scoring.
- HR: Employees CRUD, daily Attendance marking, monthly Payroll generate/edit/mark-paid (flat
  clone of `Employee.Salary` into a DRAFT row — no attendance-based pro-rating). No leave balance
  tracking, no payslip PDF.
- Manufacturing: BOM setup (finished product → components + qty), Production Orders that consume
  component stock and produce finished-good stock on completion (verified: BOM quantity × order
  quantity math is correct). No multi-level BOM explosion, no partial/WIP production states beyond
  PLANNED → COMPLETED.

Other known gaps:
- **No image/file upload** — product images and expense attachments are plain URL text fields.
- **No WhatsApp/Email sending** from the invoice screen.
- Behavioral quirks carried over faithfully from the original rather than "fixed" during the
  migration (see the git history / migration notes for the full list): sale cancel doesn't reverse
  payments or create a refund; sales/purchase returns don't touch the original invoice's paid/due
  amounts; profit/COGS calculations join against a product's *current* purchase price, not a
  historical snapshot at time of sale.
- Both `.NET` and SQL Server versions here are recent (.NET 10, SQL Server 2025) — verify behavior
  against installed versions rather than assuming from training data, same caution as the Next.js
  note above.

## Version surprises hit while building this

- **Prisma 7/8 vs. 6.19.3, npm ECONNRESET workarounds, etc.** — all specific to the archived
  Prisma-based version; no longer relevant now that the backend is .NET/SQL Server. See the
  archived version's history if resurrecting that codebase for reference.
- **`EXEC proc @Param = CASE WHEN ... END` is invalid T-SQL** — a `CASE` expression can't be used
  directly as a stored-procedure call's parameter value; compute it into a local `DECLARE`d
  variable first, then pass the variable (hit this in `sp_StockAdjustment_Create.sql`).
- **`JwtSecurityTokenHandler`'s default inbound claim-type map** silently remaps short claim names
  (e.g. `"email"`) to long legacy XML/WS-* URIs on `ValidateToken()` — clear
  `InboundClaimTypeMap = new Dictionary<string,string>()` on the handler instance to keep claim
  names exactly as issued (see `Auth/TokenService.cs`).
- `eslint-config-next` here bundles newer, stricter `eslint-plugin-react-hooks` rules (React
  Compiler-oriented). `react-hooks/set-state-in-effect` is downgraded to a warning in
  `eslint.config.mjs` (with a comment) because it flags the ordinary "fetch on mount" pattern used
  throughout this app (`useCrud`, every report page) — there's no data-fetching cache library
  (SWR/React Query) installed, so this is the deliberate, simple approach.

## Conventions

- **Modules** (used for permissions, nav, audit log): `DASHBOARD, SALES, PURCHASE, PRODUCTS,
  INVENTORY, CUSTOMERS, SUPPLIERS, CRM, HR, MANUFACTURING, EXPENSES, PAYMENTS, REPORTS, USERS,
  SETTINGS` — see `src/constants/permissions.ts` (also duplicated in `Data/DbSeeder.cs`, a plain
  C# port of the same `ROLE_GRANTS` table — keep both in sync if you add a module).
- **Permission actions**: `VIEW, CREATE, EDIT, DELETE, EXPORT, PRINT`.
- **StockTransaction types**: `PURCHASE, SALE, SALE_RETURN, PURCHASE_RETURN, ADJUSTMENT, OPENING,
  PRODUCTION_IN, PRODUCTION_OUT`.
- **"Delete" on master data with history** (Product, Customer, Supplier, Employee) never
  hard-deletes if the record has related transactions — it flips `Status = 0` instead (see the
  `sp_<Entity>_Delete` procedures). Only genuinely unreferenced records get hard-deleted. Category/
  Unit deletes instead *block* with a 400 error when referenced (they don't have a status column to
  flip to) — this matches the original app's actual behavior, not the Product-style pattern.
- Backend controllers follow the reference pattern in `Controllers/ProductsController.cs` +
  `Data/StoredProcedures/sp_Product_*.sql` for simple CRUD, and `Controllers/SalesController.cs` +
  `sp_Sale_Create.sql` for transactional multi-table writes (JSON-array input via `OPENJSON`, a
  `WHILE`-loop-over-table-variable for per-row nested procedure calls — not SQL cursors).
- Shared UI building blocks live in `src/components/common/` (Button, Input, Select, Modal,
  ConfirmDialog, Toast, Badge, EmptyState, Skeleton) and `src/components/tables/DataTable.tsx`
  (search + sort + pagination + Excel/CSV/PDF export + print, used by nearly every list page).
- `src/lib/useCrud.ts` is the standard client-side data hook for simple CRUD list pages
  (`{items, loading, create, update, remove, refresh}`); most `/api/<entity>` + `/api/<entity>/[id]`
  endpoints on the backend exist specifically to back it.
- `src/lib/serverApi.ts`'s `serverApiGet()` is the standard way for a Server Component page to read
  data server-side (see `src/app/(app)/products/[id]/page.tsx`, the customer/supplier ledger
  pages, or `src/app/(app)/layout.tsx` for the pattern) — never import a database client directly
  from a Next.js file; there isn't one anymore.
