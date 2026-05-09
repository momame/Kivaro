# Product Requirements Document
## Restaurant SaaS — Package: Table ($79/month)
**Version:** 1.0  
**Builder:** Solo  
**Target Launch:** 6–8 weeks  

---

## Stack
- **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes
- **Database:** Neon PostgreSQL with RLS for tenant isolation
- **Auth:** Clerk
- **File Storage:** DigitalOcean Spaces + presigned URLs
- **AI:** Claude API (Vision + text)
- **Deploy:** DigitalOcean App Platform
- **Billing:** Stripe (1 month free trial, then $79/month)

---

## Multi-Tenancy
- Shared database, tenant isolation via Row Level Security (RLS)
- Each restaurant = one tenant
- One owner per restaurant at this stage

---

## User Roles

| Role  | Permissions |
|-------|-------------|
| Owner | Full access — settings, reports, inventory, reservations, menu |
| Staff | Scan receipts, update stock levels, view shopping list only |

---

## Features

### 1. Reservation Management
- Create, edit, cancel reservations
- Guest name, phone, party size, date/time, notes
- Automated SMS or email reminder sent 24h and 2h before
- No-show prediction score — shows "N/A" until 5+ reservations recorded, then simple score based on historical guest behavior
- Mark reservation as seated, no-show, or cancelled

---

### 2. Digital Menu Management
- Add, edit, remove menu items
- Fields: name, description, price, category, photo
- Active/inactive toggle per item
- No online ordering in Package 1 — internal management only

---

### 3. Customer Profiles
- Auto-created on first reservation
- Tracks: name, contact, visit count, last visit date, notes
- Owner can add manual notes per customer

---

### 4. Sales Dashboard
- Daily and weekly revenue summary
- Top selling items by count
- Reservation fill rate
- Data entered manually or via POS integration placeholder for future

---

### 5. Inventory Management
- Add inventory items: name, unit, current stock, minimum threshold
- Manual stock update by staff
- Low-stock alert when item falls below threshold
- Auto-generated shopping list from all low-stock items
- Owner receives daily summary of low-stock items

---

### 6. Receipt and Invoice Scanning
- Staff opens app on phone, taps Scan Receipt
- Photo uploaded to DO Spaces via presigned URL
- Claude Vision extracts: vendor name, line items, quantities, unit prices, total
- Staff reviews extracted data, confirms or edits
- Confirmed items auto-update inventory stock levels
- Confirmed invoices saved to expense log with date and vendor

---

## Data Models (simplified)

**Tenant** — id, name, owner_id, created_at  
**User** — id, tenant_id, clerk_id, role (owner/staff)  
**Reservation** — id, tenant_id, guest_name, phone, party_size, datetime, status, no_show_score  
**Customer** — id, tenant_id, name, phone, visit_count, last_visit, notes  
**MenuItem** — id, tenant_id, name, description, price, category, photo_url, active  
**InventoryItem** — id, tenant_id, name, unit, current_stock, min_threshold  
**Receipt** — id, tenant_id, scanned_by, image_url, vendor, total, status, created_at  
**ReceiptLineItem** — id, receipt_id, name, quantity, unit_price  
**Expense** — id, tenant_id, receipt_id, vendor, total, date  

---

## Rate Limiting

- 40 receipt scans per tenant per calendar month (Package 1)
- Enforced server-side on scan API route, checked against tenant_id before image upload
- In-app counter: "X of 40 scans used this month" visible to owner and staff
- At limit: scan button disabled, upgrade prompt shown
- Counter resets 1st of each month
- Track in `Tenant` table: `scan_count_month INT`, `scan_reset_date DATE`

---

## Out of Scope — Package 1
- Offline support
- Multi-owner
- Approval workflows
- AI demand forecasting
- Supplier price comparison
- Staff scheduling
- Tip splitting
- White-label

---

## Success Metric
Owner saves minimum 1 hour per day on manual inventory and receipt entry within first 2 weeks of use.
