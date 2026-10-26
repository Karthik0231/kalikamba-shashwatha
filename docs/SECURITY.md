# Sri Kalikamba Temple — Application Security & Access Architecture

## 1. Principles
- **No Secret Leakage**: The frontend code bundle only interacts with the Supabase publishable anonymous key (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- **Never expose Service Role Keys**: Service-role keys or PostgreSQL superuser passwords are never placed in frontend code, git commits, or environment templates.
- **Row Level Security (RLS)**: Every single table in PostgreSQL has RLS enabled by default.
- **Local Fallback Protection**: When running without cloud keys, data is contained in local client-side storage with zero exposure over public networks.

---

## 2. Row Level Security Policies

The database migration enforces RLS across all operational tables:
1. `temple_settings`
2. `seva_types`
3. `festival_periods`
4. `registrations`
5. `payments`
6. `audit_logs`
7. `import_batches`
8. `import_row_errors`
9. `serial_counters`

---

## 3. Environment Variables & Secret Handling

- `.env` and all `.env.*.local` files are explicitly included in `.gitignore`.
- Only `.env.example` is tracked, containing placeholders with no actual credentials:
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
  ```

---

## 4. Financial Integrity Rules

- **Ledger Invariance**: Outstanding balance is dynamically computed as:
  $$\text{Balance Due} = \text{Agreed Fee} - \sum \text{Payment Ledger Amounts}$$
- Manually overriding a payment status to "PAID" without ledger transactions is disallowed by business rules.
- Partial and completion payments create separate identifiable ledger rows.
- Each receipt number is sequentially formatted with the temple prefix and calendar year.
