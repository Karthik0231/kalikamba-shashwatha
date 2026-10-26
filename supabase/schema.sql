-- ====================================================================
-- SRI KALIKAMBA TEMPLE BARKUR — ULTRA-LIGHT DATABASE SCHEMA
-- Zero Bloat: Compact Postgres Types + No Duplicate Indexes
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SHASHWATHA SEVA REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    serial_number VARCHAR(20) UNIQUE NOT NULL,
    devotee_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    place VARCHAR(80) DEFAULT 'Barkur (ಬಾರಕೂರು)',
    seva_type VARCHAR(20) NOT NULL CHECK (seva_type IN ('NITYA_POOJA', 'NAVARATRI', 'SONARATHI', 'ANNADANA')),
    seva_date DATE,
    festival_day SMALLINT,
    agreed_fee INTEGER NOT NULL DEFAULT 1500,
    paid_amount INTEGER NOT NULL DEFAULT 1500,
    payment_status VARCHAR(10) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Note: 'serial_number UNIQUE' automatically creates the lookup index.
-- No extra indexes needed: saves ~32 KB per table in Postgres page allocations.

-- 2. GRAMA MOKTESARARU
CREATE TABLE IF NOT EXISTS public.grama_moktesararu (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(120) NOT NULL,
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    grama VARCHAR(80) NOT NULL,
    address TEXT NOT NULL,
    designation VARCHAR(60) DEFAULT 'ಮೊಕ್ತೇಸರರು',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ANNUAL KANIKE
CREATE TABLE IF NOT EXISTS public.annual_kanike (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    year SMALLINT NOT NULL,
    festival_event VARCHAR(100) NOT NULL,
    moktesara_id TEXT,
    moktesara_name VARCHAR(120) NOT NULL,
    grama VARCHAR(80) NOT NULL,
    phone VARCHAR(20),
    people_count INTEGER NOT NULL DEFAULT 1,
    kanike_type VARCHAR(80) NOT NULL,
    amount INTEGER NOT NULL,
    receipt_number VARCHAR(40),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grama_moktesararu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_kanike ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access registrations" ON public.registrations;
CREATE POLICY "Public access registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access moktesararu" ON public.grama_moktesararu;
CREATE POLICY "Public access moktesararu" ON public.grama_moktesararu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access kanike" ON public.annual_kanike;
CREATE POLICY "Public access kanike" ON public.annual_kanike FOR ALL USING (true) WITH CHECK (true);
