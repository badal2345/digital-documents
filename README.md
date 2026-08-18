# Digital Documents

A responsive Next.js App Router application for secure, legally authorized digital-document workflows. The Aadhaar-related experience creates only a permanently watermarked **SAMPLE – NOT A VALID ID** demo and intentionally excludes UIDAI artwork, QR codes, signatures, holograms, and security features.

## Stack

Next.js 16, TypeScript, Tailwind CSS, Supabase Auth/Postgres/SSR, React Hook Form, Zod, and Lucide icons.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
3. In Supabase Dashboard, enable **Email** authentication and configure your confirmation-email settings.
4. Run `supabase/migrations/20260817000000_initial_schema.sql` in the Supabase SQL editor.
5. Start the app: `npm run dev`
6. Open `http://localhost:3000`.

The committed `.env.local` contains the publishable key supplied for this project. Never add a service-role or secret key to a `NEXT_PUBLIC_` variable.

## Authentication notes

Registration uses Supabase email + password auth. The mobile number remains required and is stored as profile metadata through a database trigger, with duplicate numbers prevented by the profile constraint. Dashboard access is checked in both the session-refresh proxy and the server layout using `auth.getUser()`.

## Data and security

All public tables use RLS and ownership checks against `auth.uid()`. Users receive read-only direct access to wallet, transaction, and generated-document rows. Document generation calls `generate_demo_document`, an authenticated atomic database function that locks credit deduction and record creation into one transaction and refuses negative balances.

## Seed/testing

Each newly registered user automatically receives a profile, wallet, and 100 welcome credits. This is deterministic seed data for testing without bypassing RLS. For SMS testing, configure test OTPs in Supabase Auth settings or use your configured provider.

## Structure

- `src/app/(auth routes)` – login, registration, recovery
- `src/app/dashboard` – protected overview and modules
- `src/components` – shared auth and application shell
- `src/utils/supabase` – browser, server, and session-refresh clients
- `supabase/migrations` – schema, triggers, grants, RLS, atomic RPC
