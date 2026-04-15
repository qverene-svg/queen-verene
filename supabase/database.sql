-- =============================================================================
-- QUEEN VERENE — COMPLETE DATABASE SETUP
-- =============================================================================
-- Run this ENTIRE file once in the Supabase SQL Editor.
-- It is fully idempotent: safe to re-run on an existing database.
--
-- What this file contains (in order):
--   1. Extensions
--   2. Tables  (CREATE TABLE IF NOT EXISTS)
--   3. Indexes
--   4. RLS helper functions  (CREATE OR REPLACE — always safe)
--   5. Row Level Security    (DROP IF EXISTS → CREATE — idempotent)
--   6. Storage bucket + policy for uploaded images
--   7. Seed data             (INSERT ... ON CONFLICT DO NOTHING)
--   8. Safety patches        (live-schema alignment)
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- Users (extends Supabase auth.users)
-- Roles:
--   admin    — full platform access
--   manager  — manage bookings, shop, staff; cannot manage users
--   staff    — view own schedule and assigned appointments
--   viewer   — read-only access to admin dashboard (e.g. silent partner)
--   customer — default for salon clients booking appointments
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('admin', 'manager', 'staff', 'viewer', 'customer')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Staff profiles
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio              TEXT,
  specialty_tags   TEXT[]    DEFAULT '{}',
  rating           DECIMAL(3,2) DEFAULT 5.0,
  commission_rate  DECIMAL(5,2) DEFAULT 0.0
);

-- Staff availability
CREATE TABLE IF NOT EXISTS public.staff_availability (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id     UUID REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_active    BOOLEAN DEFAULT true
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price            INTEGER NOT NULL,  -- stored in pesewas (1 GHS = 100 pesewas)
  description      TEXT,
  category         TEXT NOT NULL
                     CHECK (category IN (
                       'pedicure','manicure','wig_making','wig_revamp',
                       'makeup','braiding','styling','hair_care'
                     )),
  image_url        TEXT,
  is_active        BOOLEAN DEFAULT true
);

-- Appointments
-- payment_status values:
--   unpaid       — no payment received
--   deposit_paid — Hubtel deposit (GHS 50) collected, balance outstanding
--   paid         — full amount collected (alias used by dashboard/admin UI)
--   fully_paid   — canonical "paid in full" (same intent as 'paid')
--   refunded     — refund issued
-- Notes field stores optional [meta:channel=sms&name=X&phone=Y&email=Z] prefix
-- for walk-in / admin-created bookings where customer_id may be NULL.
CREATE TABLE IF NOT EXISTS public.appointments (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id            UUID REFERENCES public.users(id)          ON DELETE SET NULL,
  staff_id               UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  service_id             UUID REFERENCES public.services(id)       ON DELETE SET NULL,
  start_time             TIMESTAMPTZ NOT NULL,
  end_time               TIMESTAMPTZ NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','confirmed','completed','cancelled')),
  payment_status         TEXT NOT NULL DEFAULT 'unpaid'
                           CHECK (payment_status IN ('unpaid','deposit_paid','paid','fully_paid','refunded')),
  total_price            INTEGER NOT NULL,
  deposit_paid           INTEGER DEFAULT 0,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Phone OTPs — temporary codes for passwordless phone login
-- Accessed exclusively via the service-role admin client; no RLS required.
-- Expired / used rows accumulate and should be purged periodically (see safety patches).
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone      TEXT        NOT NULL,          -- normalised +233XXXXXXXXX
  email      TEXT        NOT NULL,          -- the auth email linked to this phone
  otp        TEXT        NOT NULL,          -- 6-digit code
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ          DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone      ON public.phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON public.phone_otps(expires_at);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT    NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL,  -- pesewas
  stock_level  INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  image_urls   TEXT[]  DEFAULT '{}',
  category     TEXT    NOT NULL,
  sku          TEXT    UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Product inquiries
CREATE TABLE IF NOT EXISTS public.product_inquiries (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id)    ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new','contacted','payment_sent','finalized')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job openings
CREATE TABLE IF NOT EXISTS public.job_openings (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  requirements TEXT    NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  date_posted  TIMESTAMPTZ DEFAULT NOW()
);

-- Career applications
CREATE TABLE IF NOT EXISTS public.applications (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id         UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT NOT NULL,
  cv_url         TEXT,
  portfolio_url  TEXT,
  status         TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','reviewed','shortlisted','rejected')),
  submitted_at   TIMESTAMPTZ DEFAULT NOW()
);

-- System / audit logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- 3. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_start_time     ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id    ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id       ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status         ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_name               ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_users_role                  ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email                 ON public.users(email);


-- =============================================================================
-- 4. RLS HELPER FUNCTION
-- =============================================================================
-- SECURITY DEFINER bypasses RLS when this function reads public.users,
-- preventing the infinite-recursion error on admin SELECT policies.

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND lower(trim(role)) IN ('admin', 'manager')
  );
$$;

REVOKE ALL  ON FUNCTION public.is_admin_or_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;


-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications      ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Admins can view all users"    ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT USING (public.is_admin_or_manager());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Required for /auth/register — new users insert their own public.users row
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ── appointments ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Customers see own appointments"  ON public.appointments;
DROP POLICY IF EXISTS "Staff see assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins see all appointments"     ON public.appointments;

CREATE POLICY "Customers see own appointments"
  ON public.appointments FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Staff see assigned appointments"
  ON public.appointments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.id = staff_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins see all appointments"
  ON public.appointments FOR ALL USING (public.is_admin_or_manager());

-- ── products ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products"   ON public.products;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT USING (is_available = true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL USING (public.is_admin_or_manager());

-- ── product_inquiries ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert inquiry"   ON public.product_inquiries;
DROP POLICY IF EXISTS "Admins view all inquiries"   ON public.product_inquiries;

CREATE POLICY "Anyone can insert inquiry"
  ON public.product_inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view all inquiries"
  ON public.product_inquiries FOR SELECT USING (public.is_admin_or_manager());

-- ── services ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone read active services" ON public.services;
DROP POLICY IF EXISTS "Admins manage services"      ON public.services;

CREATE POLICY "Anyone read active services"
  ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage services"
  ON public.services FOR ALL USING (public.is_admin_or_manager());

-- ── job_openings ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone read active job openings" ON public.job_openings;
DROP POLICY IF EXISTS "Admins manage job openings"      ON public.job_openings;

CREATE POLICY "Anyone read active job openings"
  ON public.job_openings FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage job openings"
  ON public.job_openings FOR ALL USING (public.is_admin_or_manager());

-- ── applications ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can apply"         ON public.applications;
DROP POLICY IF EXISTS "Admins view applications" ON public.applications;

CREATE POLICY "Anyone can apply"
  ON public.applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view applications"
  ON public.applications FOR SELECT USING (public.is_admin_or_manager());


-- =============================================================================
-- 6. STORAGE — verene-media bucket (images for services & products)
-- =============================================================================
-- Uploads go through /api/admin/upload (service role key) — no INSERT policy needed.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verene-media',
  'verene-media',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read verene-media" ON storage.objects;
CREATE POLICY "Public read verene-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verene-media');


-- =============================================================================
-- 7. SEED DATA  (ON CONFLICT DO NOTHING — safe to re-run)
-- =============================================================================

INSERT INTO public.services (name, duration_minutes, price, description, category)
VALUES
  ('Classic Pedicure',    60,  15000, 'Relaxing foot soak, nail trim, cuticle care, and polish.',                        'pedicure'),
  ('Luxury Manicure',     45,  12000, 'Nail shaping, cuticle treatment, hand massage, and premium polish.',              'manicure'),
  ('Bridal Makeup',      120,  80000, 'Full glam bridal look with lashes and long-lasting setting spray.',               'makeup'),
  ('Wig Installation',    90,  35000, 'Professional wig fitting, styling, and customization.',                           'wig_making'),
  ('Wig Revamp',          60,  20000, 'Deep conditioning, restyling, and refurbishment of existing wigs.',               'wig_revamp'),
  ('Ghana Braiding',     180,  45000, 'Expertly crafted traditional or modern braiding styles.',                         'braiding'),
  ('Silk Press & Style', 120,  30000, 'Professional silk press with blowout and flat iron finish.',                      'styling'),
  ('Deep Hair Treatment', 60,  18000, 'Intensive moisturizing mask and scalp treatment.',                                'hair_care')
ON CONFLICT DO NOTHING;

INSERT INTO public.job_openings (title, description, requirements)
VALUES
  (
    'Senior Hair Stylist',
    'Join our elite team as a senior stylist specializing in natural hair and silk presses. '
    'You will work with a discerning clientele in a luxury salon environment.',
    'Minimum 3 years professional experience. Portfolio required. Certification in hair care preferred.'
  ),
  (
    'Makeup Artist',
    'We are looking for a talented makeup artist to join the Verene family. '
    'Bridal and event makeup experience is a plus.',
    'Minimum 2 years experience. Strong portfolio of bridal and editorial looks. Available for weekends.'
  )
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 8. SAFETY PATCHES  (live-schema alignment — idempotent)
-- =============================================================================
-- These ALTER TABLE statements update already-existing databases without
-- requiring a full schema drop and re-create.

-- ── appointments: payment_status ─────────────────────────────────────────────
-- Add 'paid' alongside existing values ('unpaid','deposit_paid','fully_paid','refunded').

ALTER TABLE public.appointments
  ALTER COLUMN payment_status SET DEFAULT 'unpaid';

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status IN ('unpaid','deposit_paid','paid','fully_paid','refunded'));

-- ── appointments: drop legacy column (if it exists) ──────────────────────────
-- hubtel_transaction_ref was removed from the schema; drop silently if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'appointments'
       AND column_name  = 'hubtel_transaction_ref'
  ) THEN
    ALTER TABLE public.appointments DROP COLUMN hubtel_transaction_ref;
  END IF;
END $$;

-- ── users: role — add 'viewer' ────────────────────────────────────────────────
-- Viewer is a read-only dashboard role (silent partner / investor).

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'staff', 'viewer', 'customer'));

-- ── appointments: ensure end_time column exists ───────────────────────────────
-- Earlier environments may be missing end_time if created before this field was added.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'appointments'
       AND column_name  = 'end_time'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN end_time TIMESTAMPTZ;
    -- Back-fill with start_time + 60 minutes for any existing rows
    UPDATE public.appointments SET end_time = start_time + INTERVAL '60 minutes' WHERE end_time IS NULL;
    ALTER TABLE public.appointments ALTER COLUMN end_time SET NOT NULL;
  END IF;
END $$;

-- ── phone_otps: purge expired rows ───────────────────────────────────────────
-- Safe to re-run; removes codes older than 1 hour to keep the table tidy.
DELETE FROM public.phone_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
