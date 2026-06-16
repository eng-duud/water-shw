# Water Billing System - Task Tracker

## Phase 1 — Project Scaffolding
- [x] Initialize Next.js project with TypeScript + Tailwind
- [x] Install dependencies (prisma, decimal.js, zod)
- [x] Create .env.example
- [x] Configure Prisma with dual URLs
- [x] Create lib/prisma.ts singleton
- [x] Create lib/constants.ts
- [x] Create lib/cloudinary.ts

## Phase 2 — Database Schema
- [x] Write Prisma schema with all models
- [x] Generate Prisma client

## Phase 3 — Billing Calculation Engine
- [x] Create lib/billing.ts
- [x] Verify test case (13,500)

## Phase 4 — Payment Distribution Engine
- [x] Create lib/payment-distribution.ts

## Phase 5 — API Routes
- [x] /api/customers (GET, POST)
- [x] /api/customers/[id] (GET, PUT)
- [x] /api/billing (GET, POST)
- [x] /api/billing/[cycleId] (GET, PUT)
- [x] /api/billing/[cycleId]/entries (GET, POST, PUT)
- [x] /api/billing/calculate (POST)
- [x] /api/payments (GET, POST)
- [x] /api/payments/[id]/surplus (PUT)
- [x] /api/dashboard (GET)

## Phase 6 — UI Components
- [x] Root layout (RTL, Arabic font, sidebar)
- [x] Dashboard page
- [x] Customer management pages
- [x] Batch billing entry page
- [x] Payment recording page

## Phase 7 — Print System
- [x] Print CSS styles
- [x] Single bill print page
- [x] Batch print page

## Phase 8 — Deployment Config
- [x] next.config.ts
- [x] Vercel build script
