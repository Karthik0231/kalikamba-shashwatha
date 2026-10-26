-- ====================================================================
-- SRI KALIKAMBA TEMPLE BARKUR — DATABASE SCHEMA
-- Execute this entire script in Supabase: Project -> SQL Editor -> New Query -> Run
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SHASHWATHA SEVA REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    serial_number TEXT UNIQUE NOT NULL,
    devotee_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    place TEXT DEFAULT 'Barkur (ಬಾರಕೂರು)',
    seva_type TEXT NOT NULL CHECK (seva_type IN ('NITYA_POOJA', 'NAVARATRI', 'SONARATHI', 'ANNADANA')),
    seva_date DATE,
    festival_day INTEGER,
    agreed_fee NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast Indexing
CREATE INDEX IF NOT EXISTS idx_registrations_serial ON public.registrations(serial_number);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_seva_type ON public.registrations(seva_type);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON public.registrations(seva_date);

-- 2. GRAMA MOKTESARARU (VILLAGE HEADS DIRECTORY)
CREATE TABLE IF NOT EXISTS public.grama_moktesararu (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    grama TEXT NOT NULL,
    address TEXT NOT NULL,
    designation TEXT DEFAULT 'ಮೊಕ್ತೇಸರರು',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_moktesararu_grama ON public.grama_moktesararu(grama);
CREATE INDEX IF NOT EXISTS idx_moktesararu_phone ON public.grama_moktesararu(phone_primary);

-- 3. ANNUAL KANIKE & FESTIVAL REMITTANCES LEDGER
CREATE TABLE IF NOT EXISTS public.annual_kanike (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    year INTEGER NOT NULL,
    festival_event TEXT NOT NULL,
    moktesara_id TEXT,
    moktesara_name TEXT NOT NULL,
    grama TEXT NOT NULL,
    phone TEXT,
    people_count INTEGER NOT NULL DEFAULT 1,
    kanike_type TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    receipt_number TEXT,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_kanike_year_event ON public.annual_kanike(year, festival_event);
CREATE INDEX IF NOT EXISTS idx_kanike_grama ON public.annual_kanike(grama);
CREATE INDEX IF NOT EXISTS idx_kanike_type ON public.annual_kanike(kanike_type);

-- 4. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- Allows temple web app direct secure read/write
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grama_moktesararu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_kanike ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access registrations" ON public.registrations;
CREATE POLICY "Public access registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access moktesararu" ON public.grama_moktesararu;
CREATE POLICY "Public access moktesararu" ON public.grama_moktesararu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access kanike" ON public.annual_kanike;
CREATE POLICY "Public access kanike" ON public.annual_kanike FOR ALL USING (true) WITH CHECK (true);
