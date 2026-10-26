# Sri Kalikamba Temple Barkur — Seva Management System
## ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ ಬಾರಕೂರು

A fast, unified, non-technical friendly Seva Management System specifically designed for **Sri Kalikamba Temple, Barkur (Udupi)**.

---

## What was built:

- **All-in-One Command Center**: Zero bloated dashboards or nested menus. Everything operational is accessible in a single screen.
- **Seva Tabs**:
  - `All Sevas` (ಎಲ್ಲಾ ಸೇವೆಗಳು)
  - `Shashwatha Nitya Pooja` (ಶಾಶ್ವತ ನಿತ್ಯ ಪೂಜೆ)
  - `Shashwatha Navaratri` (ಶಾಶ್ವತ ನವರಾತ್ರಿ - Day 1 to 10)
  - `Shashwatha Sonarathi` (ಶಾಶ್ವತ ಸೋನಾರತಿ - Day 1 to 30)
  - `Shashwatha Annadana` (ಶಾಶ್ವತ ಅನ್ನದಾನ)
- **Large Filter Controls**:
  - 1-click **Today's Seva** (ಇಂದಿನ ಸೇವೆ) & **Tomorrow** (ನಾಳೆಯ ಸೇವೆ).
  - Navaratri day selector pills (Day 1 through Day 10).
  - Sonarathi day selector dropdown (Day 1 through Day 30).
  - Calendar date selector for Nitya Pooja and Annadana.
  - Payment filter (All, Full Paid, Balance Pending).
  - Instant global search (Serial number, Name, Phone, Address).
- **Essential Data Only**:
  - Serial Number, Devotee Name, Phone, Address, Seva Category, Seva Occurrence Date/Day, Agreed Fee, Paid Amount, Balance.
- **Fast Actions**:
  - **Add Seva** (`Ctrl+N` or `+ Add Seva` button).
  - **Bulk Upload** Excel (`.xlsx`) or `.csv` with auto-column detection.
  - **Export to Excel** (`Ctrl+E` or `Export Excel` button).
  - **Print Official Receipt** for devotee with signature lines.
  - **Print Daily Register Sheet** (`Ctrl+P`).
  - **Quick Edit** and **Delete**.
- **Customizations**:
  - Color Theme switcher (Forest Green, Royal Saffron, Temple Crimson, Vedic Blue).
  - Light & Dark theme toggle.
  - Full Kannada & English toggle.
- **Keyboard Shortcuts**:
  - `Ctrl+N` / `Alt+N`: New Seva
  - `Ctrl+E`: Export Excel
  - `Ctrl+F` or `/`: Focus search
  - `Ctrl+P`: Print current register
  - `Esc`: Close any modal

---

## Running the Application

```bash
cd c:\LogicTech\temple\Knote
npm run dev
```

Build & Typecheck:
```bash
npx tsc --noEmit
npm run build
```
