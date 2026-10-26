# Sri Kalikamba Temple — Database Architecture & Schema Specification

## 1. Overview
The database layer is designed for Supabase PostgreSQL with strict Row Level Security (RLS), atomic transactional counter sequences, relational integrity, and UTF-8 Kannada/English Unicode support.

---

## 2. Core Tables and Relationships

### `temple_settings`
- **Purpose**: Stores official temple identity, contact numbers, address, receipt prefix, currency, and date formats.
- **Key Columns**:
  - `temple_name_kn`: `ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ವಿನಾಯಕ ದೇವಸ್ಥಾನ`
  - `temple_name_en`: `Sri Kalikamba Vinayaka Temple`
  - `address_kn`, `address_en`
  - `phone`, `email`
  - `receipt_prefix` (default `SKT`)
  - `serial_policy` (`category_prefixed`)

### `seva_types`
- **Purpose**: Defines permanent seva categories seeded with the 4 core temple sevas.
- **Seeded Categories**:
  1. `NITYA_POOJA` — *Shashwatha Nitya Pooja* / *ಶಾಶ್ವತ ನಿತ್ಯ ಪೂಜೆ* (Default ₹1,500)
  2. `NAVARATRI` — *Shashwatha Navaratri Pooja* / *ಶಾಶ್ವತ ನವರಾತ್ರಿ ಪೂಜೆ* (Default ₹2,000)
  3. `SONARATHI` — *Shashwatha Sonarathi Pooja* / *ಶಾಶ್ವತ ಸೋನಾರತಿ ಪೂಜೆ* (Default ₹2,500)
  4. `ANNADANA` — *Shashwatha Annadana Seva* / *ಶಾಶ್ವತ ಅನ್ನದಾನ ಸೇವೆ* (Default ₹5,000)

### `festival_periods`
- **Purpose**: Configurable festival periods (e.g., Sharada Navaratri 10 days, Shravana Sona Masa 30 days) with year and start/end dates.
- **Constraints**: `CHECK (end_date >= start_date)`.

### `registrations`
- **Purpose**: Permanent Seva Devotee Register.
- **Key Columns**:
  - `id`: Internal UUID primary key.
  - `serial_number`: Human-readable serial number (e.g. `SNP-00101`, `SNV-00045`).
  - `legacy_serial_number`: Physical book serial number if migrated (e.g. `BK-1/101`).
  - `legacy_register_book`: Name of physical ledger book (e.g. `Register 1 (1998-2005)`).
  - `devotee_name`: Devotee full name.
  - `alternate_name`: Transliterated or alias name.
  - `phone_primary`: 10-digit mobile number.
  - `normalized_phone`: Digits-only normalized string for instant indexing.
  - `gothra`, `nakshatra`, `rashi`: Traditional family astronomical metadata.
  - `address`, `locality`, `city`, `pincode`.
  - `booking_date`: Date when devotee booked the seva.
  - `applicable_seva_date`: Annual recurring date or festival date.
  - `agreed_fee`: Agreed permanent endowment amount (`NUMERIC(12, 2)`).
  - `administrative_notes`: Remarks, prayer requests, family member names.
  - `is_archived`: Soft-delete flag (preserves historical continuity).

### `payments`
- **Purpose**: Double-entry financial ledger for all cash, UPI, and bank collections.
- **Key Columns**:
  - `id`: UUID.
  - `registration_id`: Foreign key to `registrations.id`.
  - `receipt_number`: Formatted receipt identifier (e.g. `SKT-2026-0045`).
  - `amount`: `NUMERIC(12, 2) CHECK (amount > 0)`.
  - `payment_method`: `CASH`, `UPI`, `BANK_TRANSFER`, `CHEQUE`, `CARD`, `OTHER`.
  - `payment_date`: Date payment was collected.
  - `transaction_reference`: Bank UTR or UPI transaction ID.
  - `payment_type`: `INITIAL`, `PARTIAL`, `COMPLETION`, `ADJUSTMENT`.

### `audit_logs`
- **Purpose**: Immutable history of all creations, updates, archiving, and batch imports.
- **Key Columns**:
  - `actor_id`: Staff member identifier.
  - `action`: `CREATE`, `UPDATE`, `DELETE`, `IMPORT`, `RESTORE`.
  - `entity_type`: `registration`, `payment`, `seva_type`, `settings`.
  - `entity_id`: Target record ID.
  - `before_state`, `after_state`: JSON snapshots.
  - `created_at`: Timestamp.

---

## 3. Serial Number Generation Policy

Serial numbers are generated atomically using transactional row-level locking on `serial_counters`:
```sql
CREATE OR REPLACE FUNCTION generate_next_serial(p_prefix TEXT)
RETURNS TEXT ...
```
- Category prefixes:
  - `SNP`: Shashwatha Nitya Pooja
  - `SNV`: Shashwatha Navaratri Pooja
  - `SNR`: Shashwatha Sonarathi Pooja
  - `SSA`: Shashwatha Annadana Seva
- Formatted as `PREFIX-00001` (zero-padded 5 digits).
- Thread-safe and immune to concurrent race conditions.

---

## 4. Phone Normalization Trigger
Phone numbers are automatically normalized on write via trigger `set_normalized_phone` calling `normalize_phone_number(phone)`. All spaces, dashes, and international prefixes (+91, 0) are stripped to enable sub-second indexing.

---

## 5. Migration Files
All migrations are located in `supabase/migrations/`:
- `20261026000001_initial_schema.sql`
