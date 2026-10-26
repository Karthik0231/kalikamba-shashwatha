# Sri Kalikamba Temple — Historical Register Import Guide

## 1. Overview
The **Historical Import Centre** (`/imports`) enables temple administrators to migrate 500 to 1,000+ handwritten physical records from legacy registers without manual re-entry.

---

## 2. 8-Step Import Workflow

```
1. Download Template  ──> 2. Transcribe & Save  ──> 3. Upload (.xlsx / .csv)
       │
       ▼
4. Map Columns        ──> 5. Validate & Preview ──> 6. Resolve Errors
       │
       ▼
7. Batch Commit       ──> 8. Reconcile & Verify
```

### Step 1: Download Standard Template
1. Navigate to **Data Import** in the sidebar.
2. Click **Download Standard Template (.xlsx)**.
3. The downloaded spreadsheet has pre-configured columns:
   - `Serial Number (Optional)` (e.g. `SNP-00201`)
   - `Legacy Book/SNo` (e.g. `Book 1 / No. 201`)
   - `Devotee Name *` (Kannada or English)
   - `Phone Number *`
   - `Address *`
   - `Gothra`, `Nakshatra`
   - `Seva Code *` (`NITYA_POOJA`, `NAVARATRI`, `SONARATHI`, `ANNADANA`)
   - `Booking Date` (`YYYY-MM-DD`)
   - `Seva Occurrence Date` (`YYYY-MM-DD`)
   - `Agreed Fee`
   - `Amount Paid`

### Step 2: Prepare Spreadsheet
- Fill in the devotee records from the physical temple register.
- If the original serial number is unknown, leave it blank; the system will assign the next sequential serial automatically.
- Keep the legacy register book name (e.g. `Register 1 (1998-2005)`) in the `Legacy Book/SNo` column so you can always trace the record back to the physical page.

### Step 3: Upload File
- Drag and drop or browse for the `.xlsx` or `.csv` file.
- The built-in client parser reads all headers and row counts securely in the browser.

### Step 4: Map Columns
- Match your spreadsheet columns with the application fields.
- The system automatically detects common Kannada and English column headers.

### Step 5: Preview & Validate
- The system checks every row for:
  - Missing mandatory fields (Name, Phone, Address).
  - Invalid or malformed phone numbers.
  - Unknown seva categories.
- Rows with errors are highlighted in red with descriptive explanations.

### Step 6: Batch Commit
- Click **Commit Valid Records**.
- Valid registrations are committed in atomic batches. Initial paid amounts are automatically recorded in the payment ledger with receipt references.

---

## 3. Reconciliation & Audit
- Each import batch is logged in the **Import Batches Log** with:
  - Batch ID
  - Original file name
  - Total rows, imported rows, skipped rows, error rows
  - Timestamp
