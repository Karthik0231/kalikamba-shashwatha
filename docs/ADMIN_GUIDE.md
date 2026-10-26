# Sri Kalikamba Temple — Temple Staff & Administrator Operating Guide

## 1. Daily Temple Administration Workflow

### Starting the Day
1. Open the application.
2. The **Dashboard** displays:
   - Total registrations in the temple records.
   - Number of sevas scheduled for today.
   - Total fees collected and outstanding balances.
3. Click on **Today's Seva Schedule** (`/daily-seva`).
4. Click **Print Daily Register** to print the physical pooja sankalpa sheet for the chief Archaka/priest.

---

## 2. Registering a New Devotee

1. Click the top-bar **+ New Seva** button or navigate to `/registrations/new`.
2. Fill in:
   - **Devotee Name** (in Kannada and/or English).
   - **Mobile Number** (10 digits).
   - **Address** (House number, street, area, pincode).
   - **Gothra & Nakshatra** (Optional family astronomical information).
   - **Legacy Book/Serial Number** (if transcribing from physical register).
3. Select the **Seva Category**:
   - *Shashwatha Nitya Pooja*
   - *Shashwatha Navaratri Pooja*
   - *Shashwatha Sonarathi Pooja*
   - *Shashwatha Annadana Seva*
4. Set the **Annual Occurrence Date** (e.g. devotee birthday, wedding anniversary, or birth star day).
5. Enter the **Agreed Fee** and **Initial Payment Amount** (Cash, UPI, or Bank Transfer).
6. Click **Confirm Registration Details**.
7. The system assigns the permanent serial number (e.g. `SNP-00105`) and redirects to the detail page.
8. Click **Print Receipt** to issue a paper receipt with temple signature seals.

---

## 3. Finding an Existing Registration

When a devotee arrives or calls regarding their seva:
1. Type their **Serial Number** (e.g. `SNP-00101` or `101`), **Devotee Name**, or **Phone Number** into the global search bar at the top of any page.
2. Or use the filters on the **Registrations** (`/registrations`) page by Seva Type or Payment Status.
3. Click **View** on the matching row to inspect their full payment history, seva date, and address.

---

## 4. Recording Subsequent or Partial Payments

1. Open the devotee's registration details page (`/registrations/:id`).
2. In the fee ledger section, click **Record Payment**.
3. Enter the amount paid, payment method (Cash/UPI/Bank Transfer), and optional transaction reference.
4. Click **Save**. The payment ledger updates instantly, balance due recalculates, and status changes to *Paid in Full* when balance reaches ₹0.

---

## 5. Printing Official Receipts

1. Open any registration record.
2. Click **Print Receipt**.
3. A clean, official black-and-white temple receipt formatted with temple headers, serial numbers, devotee details, paid amount in figures, and signature lines appears in the browser print dialog.
