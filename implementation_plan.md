# Water Billing & Collection Management System

**Project:** Ghayl Al-Diya - Qadas Al-Mwasat (غيل الضياء - قضاء المواسط)  
**Architecture:** Single-Tenant with `tenantId` column for future SaaS migration

## User Review Required

- **Tailwind CSS Version**: I will use **Tailwind CSS v4** (CSS-first config). Confirm or specify v3.
- **Next.js Router**: I will use the **App Router** with server components and server actions.
- **Currency**: Assumed **Yemeni Rial (YER)**. Confirm if different.
- **Authentication**: Not included in spec. Building as open admin dashboard with future auth placeholder. Should I add basic auth now?

## Open Questions

1. **Billing Cycle Period**: Monthly with `year-month` identifier assumed. Custom periods needed?
2. **Customer Photo**: Implementing as **meter reading photos** (proof of reading). Profile photos too?
3. **Multi-language**: Arabic-only or add English toggle?
4. **Bill Number Format**: Using `INV-{YYYY}{MM}-{sequential}`. Custom format needed?

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Neon Serverless PostgreSQL |
| ORM | Prisma (dual URL config) |
| Styling | Tailwind CSS v4 |
| Image Upload | Cloudinary (unsigned, client-side) |
| Deployment | Vercel |
| Validation | Zod |
| Decimal Math | `decimal.js` |
| Font | IBM Plex Sans Arabic |

---

## Phase 1 — Project Scaffolding

```
my-water/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (RTL, Arabic font)
│   │   ├── page.tsx                # Dashboard
│   │   ├── globals.css             # Tailwind v4 @theme + print styles
│   │   ├── customers/
│   │   │   ├── page.tsx            # Customer list
│   │   │   └── [id]/page.tsx       # Customer detail/edit
│   │   ├── billing/
│   │   │   ├── page.tsx            # Batch billing entry
│   │   │   └── [cycleId]/page.tsx  # Cycle detail
│   │   ├── payments/
│   │   │   └── page.tsx            # Payment recording
│   │   ├── print/
│   │   │   ├── bill/[id]/page.tsx  # Single bill print
│   │   │   └── batch/[cycleId]/page.tsx  # Batch print
│   │   └── api/
│   │       ├── customers/route.ts
│   │       ├── billing/route.ts
│   │       ├── billing/calculate/route.ts
│   │       └── payments/route.ts
│   ├── lib/
│   │   ├── prisma.ts               # Prisma singleton
│   │   ├── billing.ts              # Billing calculation logic
│   │   ├── payment-distribution.ts # Payment allocation logic
│   │   ├── cloudinary.ts           # Upload utility
│   │   └── constants.ts            # Pricing tiers
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   ├── layout/                 # Sidebar, header
│   │   ├── customers/              # Customer components
│   │   ├── billing/                # Billing components
│   │   └── print/                  # Print layout components
│   └── types/index.ts
├── .env.example
└── next.config.ts
```

---

## Phase 2 — Database Schema (Prisma)

All tables include `tenantId`. Key models:

- **Tenant** + **TenantSettings**: Configurable pricing tiers (work unit price, tier limits)
- **Customer**: Account number (unique per tenant), work units, meter number
- **BillingCycle**: Year/month, status (DRAFT → ISSUED → CLOSED)
- **Bill**: Full calculation breakdown (previousReading, currentReading, consumption, tier costs, totalAmount, paidAmount, status)
- **Payment**: Amount, allocated vs surplus tracking, surplus handled flag
- **PaymentAllocation**: Junction table linking payments to bills with amounts

Key: `Decimal(12,2)` for ALL monetary/meter values to prevent floating-point errors.

---

## Phase 3 — Billing Calculation Engine

Using `decimal.js` for precision arithmetic:

```
Formula: Total = (WorkUnits × 2000) + (Tier1Units × 700) + (Tier2Units × 1000)

Where:
  Consumption = CurrentReading - PreviousReading
  Tier1Units = min(Consumption, 4)
  Tier2Units = max(Consumption - 4, 0)
```

**Test Case**: WorkUnits=1, Prev=34.4, Curr=47.1 → **13,500** ✅

---

## Phase 4 — Payment Distribution Engine

FIFO allocation with surplus detection:

1. Fetch PENDING/PARTIALLY_PAID bills (oldest first)
2. Calculate total outstanding debt
3. Allocate payment to bills in order
4. If payment > total debt → flag surplus (NOT auto-deducted from future)
5. Entire operation in database transaction
6. Create PaymentAllocation audit trail records

**Immutability**: Bill.totalAmount never changes after issuance. Payment amount never changes after creation.

---

## Phase 5 — API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/customers` | GET, POST | List/create customers |
| `/api/customers/[id]` | GET, PUT | Get/update customer |
| `/api/billing` | GET, POST | List/create billing cycles |
| `/api/billing/[cycleId]` | GET, PUT | Get/issue cycle |
| `/api/billing/[cycleId]/entries` | GET, POST, PUT | Bill entries CRUD |
| `/api/billing/calculate` | POST | Real-time calculation |
| `/api/payments` | GET, POST | List/create payments |
| `/api/payments/[id]/surplus` | PUT | Handle surplus manually |
| `/api/dashboard` | GET | Dashboard aggregations |

---

## Phase 6 — UI (Arabic RTL, Tailwind CSS v4)

- Root: `dir="rtl"` + `lang="ar"` + IBM Plex Sans Arabic font
- Dark sidebar with glassmorphism effects
- OKLCH color system (primary blue, teal accent, semantic colors)
- **Dashboard**: 4 stat cards, monthly trends, recent activity
- **Customer Management**: Searchable table, add/edit modal, Cloudinary upload
- **Batch Billing Entry**: Tabular interface, inline current reading entry, real-time calc
- **Payment Recording**: Customer selector, amount input, distribution preview, surplus alert

---

## Phase 7 — Print System

- `@media print` CSS: hide nav, reset colors, page breaks
- `@page { margin: 1cm; size: A4; }`
- Single bill print: `/print/bill/[id]`
- Batch print: `/print/batch/[cycleId]` with `page-break-after: always`
- No URL headers/footers

---

## Phase 8 — Deployment

- Vercel build: `prisma generate && prisma migrate deploy && next build`
- Environment variables in Vercel dashboard
- `.env.example` with all required vars documented

---

## Verification Plan

1. Unit test `calculateBill()` with exact test case (expect 13,500)
2. Unit test payment distribution (partial, exact, surplus cases)
3. Test batch billing UI with real-time calculation
4. Print bills to PDF and verify layout
5. Verify RTL Arabic rendering
6. Deploy to Vercel with Neon database
