# Sri Kalikamba Temple — Independent Backup, Recovery & Data Ownership

## 1. Data Ownership Statement
The physical temple registers and their digitized records are the sacred property of **Sri Kalikamba Vinayaka Temple**. The application guarantees 100% data sovereignty and does not lock the temple into any single proprietary vendor or paid cloud tier.

---

## 2. Independent Backup Process

Administrators can export and retain independent offline copies without technical assistance:

### Method A: One-Click Full Database JSON Export
1. Navigate to **Settings** (`/settings`).
2. Scroll to **Independent Backup & Data Ownership**.
3. Click **Download Full JSON Database Backup**.
4. The downloaded file contains:
   - Temple settings and receipt configuration
   - All seva types and festival period rules
   - Every registration record with historical serial numbers
   - Full payment ledger with receipts and transaction references
   - Complete audit trail logs
5. Store this file on a secure external USB flash drive or encrypted offline hard disk.

### Method B: Excel / CSV Master Register Export
1. Navigate to **Reports** (`/reports`) or **Registrations** (`/registrations`).
2. Click **Export Excel**.
3. The downloaded `.xlsx` contains all active registrations with devotee names, addresses, phones, agreed fees, paid amounts, and outstanding balances.

---

## 3. Recovery Procedure

To restore data onto a new machine or empty development environment:
1. Clone the repository and install dependencies: `npm i --legacy-peer-deps`.
2. Apply the Supabase migration: `supabase/migrations/20261026000001_initial_schema.sql`.
3. If restoring from historical spreadsheets, use the **Historical Import Centre** (`/imports`).
4. If restoring from a JSON backup, upload the JSON directly through the administrative settings panel or Supabase SQL console.

---

## 4. Free-Tier Considerations

When utilizing the Supabase Free Tier:
- **Database Storage**: 500 MB (sufficient for ~200,000+ registration records).
- **Inactivity Pausing**: Free-tier projects may pause after 7 days of inactivity. Simply logging into the Supabase dashboard unpauses the project in under 30 seconds.
- **Backups**: Free tiers do not include automatic Point-In-Time-Recovery (PITR). Therefore, staff must perform weekly one-click JSON backups as documented above.
