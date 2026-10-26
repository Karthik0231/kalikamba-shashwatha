-- ====================================================================
-- SRI KALIKAMBA TEMPLE BARKUR — SEVA MANAGEMENT SYSTEM
-- Clean, Lightweight Database Schema
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Registrations Table (Zero Waste, Essential Fields Only)
CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    serial_number TEXT UNIQUE NOT NULL,
    devotee_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    normalized_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    seva_type TEXT NOT NULL CHECK (seva_type IN ('NITYA_POOJA', 'NAVARATRI', 'SONARATHI', 'ANNADANA')),
    seva_date DATE, -- For Nitya Pooja & Annadana annual date
    festival_day INTEGER, -- 1-10 for Navaratri, 1-30 for Sonarathi
    agreed_fee NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast Search Indexes
CREATE INDEX IF NOT EXISTS idx_reg_serial ON registrations(serial_number);
CREATE INDEX IF NOT EXISTS idx_reg_phone ON registrations(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_reg_seva_type ON registrations(seva_type);
CREATE INDEX IF NOT EXISTS idx_reg_date ON registrations(seva_date);
CREATE INDEX IF NOT EXISTS idx_reg_fest_day ON registrations(festival_day);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for staff" ON registrations FOR ALL USING (true);
