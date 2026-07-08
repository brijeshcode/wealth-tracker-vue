# Admin Stock Master — Design Spec

**Date:** 2026-07-08
**Status:** Approved

---

## Overview

An intentionally separate admin area (`/admin/*`) that lets admin users manage the stock master — bulk-importing NSE equity data and manually adding/editing individual stocks and ETFs. Regular users have no access and no visibility of admin routes or nav.

---

## Auth & Access

Admin access is verified by calling `GET /api/admin/me` on every entry to the admin area. A 200 response means the bearer token belongs to an admin user. A 403 response means it does not. The frontend does **not** rely on any `is_admin` flag stored locally — it always probes the endpoint.

The `useAuthStore` and the regular `User` type remain unchanged.

---

## Routes

All admin routes are children of `AdminLayout`, which owns the access check.

| Path | Component | Notes |
|---|---|---|
| `/admin` | — | Redirects to `/admin/stocks/import-nse` |
| `/admin/stocks/import-nse` | `AdminNseImportView` | Bulk NSE CSV upload |
| `/admin/stocks/upsert` | `AdminStockUpsertView` | Manual single-stock form |

No `meta.requiresAdmin` flag on the router — access is handled entirely inside `AdminLayout.vue`.

---

## New Files

```
src/
  layouts/
    AdminLayout.vue               ← access check + shell
  views/
    admin/
      AdminNseImportView.vue      ← NSE CSV upload page
      AdminStockUpsertView.vue    ← manual upsert form
  services/
    adminService.ts               ← all admin API calls
  types/
    admin.ts                      ← admin-specific types
```

No changes to `navConfig.ts`, `AppLayout.vue`, or `useAuthStore.ts`.

---

## AdminLayout.vue

Mounted state machine — three states:

1. **checking** — full-screen centered spinner, text "Verifying admin access…"
2. **denied** — full-screen: lock icon, heading "Admin Access Required", body "Your account does not have admin privileges.", "← Back to app" button linking to `/dashboard`
3. **granted** — two-column shell:
   - **Left sidebar** (narrow, fixed): app name/logo area, nav links, "← Back to app" at bottom
   - **Right content area**: `<RouterView />`

Sidebar nav links:
- "NSE Import" → `/admin/stocks/import-nse`
- "Add / Edit Stock" → `/admin/stocks/upsert`

On mount: calls `adminService.checkAccess()`, sets state to `granted` on 200, `denied` on 403.

---

## AdminNseImportView.vue

**Purpose:** Upload EQUITY_L.csv from NSE India to refresh the full stock master.

**UI flow:**

1. File drop zone — accepts `.csv` and `.txt`, max 10 MB. Same drag-drop pattern as the existing stock import page.
2. "Upload & Import" button — disabled until a file is selected, shows loading state during upload.
3. **On success (200):** Replaces the upload zone with a result card showing three stat tiles: Inserted / Updated / Skipped. A "Upload another file" button resets the view.
4. **On error (422):** Inline error message below the upload zone. File remains selected so the user can swap it.

No preview step — this is a direct upsert operation, safe to re-run at any time.

---

## AdminStockUpsertView.vue

**Purpose:** Add or update a single stock or ETF not covered by the NSE CSV (e.g. ETFs, BSE-only listings).

**Form fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| ISIN | text input | yes | Primary key, max 20 chars |
| Company Name | text input | yes | Max 255 chars |
| NSE Symbol | text input | no | e.g. NIFTYBEES |
| BSE Symbol | text input | no | Usually same as NSE |
| BSE Code | text input | no | Numeric scrip code e.g. 500325 |
| Sector | text input | no | e.g. ETF, IT, Banking |
| Industry | text input | no | e.g. Gold ETF, Index ETF |
| Active | toggle | no | Defaults to true |

**UI flow:**

1. Form renders with all fields. Active toggle defaults to on.
2. "Save Stock" button — disabled while submitting.
3. **On 201 (created):** Green success banner above the form: "Stock created — Nippon India ETF Nifty 50 BeES". Form is **not** reset so the admin can make follow-up edits.
4. **On 200 (updated):** Same banner with "Stock updated — …".
5. **On 422:** Field-level error messages inline below each affected input. The ISIN and Company Name inputs show errors if validation fails.

---

## Service — `adminService.ts`

```ts
class AdminService {
  checkAccess(): Promise<AdminUser>
  importNse(file: File): Promise<NseImportResult>
  upsertStock(data: StockUpsertPayload): Promise<{ stock: StockMasterRecord; created: boolean }>
}
```

`checkAccess` uses `validateStatus: (s) => s === 200 || s === 403` so 403 resolves (not rejects), letting `AdminLayout` handle it without a try/catch on an exception.

`importNse` sends `multipart/form-data`. On 422 it rejects normally — the view catches and displays the message.

`upsertStock` sends `application/json`. Distinguishes created vs updated by checking `response.status === 201`.

---

## Types — `admin.ts`

```ts
export interface AdminUser {
  id: number
  name: string
  email: string
}

export interface NseImportResult {
  inserted: number
  updated: number
  skipped: number
}

export interface StockUpsertPayload {
  isin: string
  company_name: string
  nse_symbol?: string
  bse_symbol?: string
  bse_code?: string
  sector?: string
  industry?: string
  is_active?: boolean
}

export interface StockMasterRecord {
  id: number
  isin: string
  company_name: string
  nse_symbol: string | null
  bse_symbol: string | null
  bse_code: string | null
  sector: string | null
  industry: string | null
  is_active: boolean
}
```

---

## Out of Scope

- `POST /api/admin/stocks/import-nse-etf` — endpoint not built yet; placeholder route not added
- Listing / searching / deleting stocks from the admin panel
- Dividend and corporate action endpoints (future spec)
- Any changes to the regular user-facing stock pages
