# Roles: Admin, Customer, Seller (Vendor)

This document defines what each role can do in this codebase and which API routes power it.

## Admin (marketplace operator)

**Purpose:** Operate the platform—users, catalog oversight, orders, and visibility into group deals.

| Capability | UI | API |
|------------|----|-----|
| Dashboard counts (users, products, orders, deals) | `/admin` → Overview | `GET /api/admin/stats` |
| List users, change roles | `/admin` → Users | `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` |
| Browse all products, remove any listing | `/admin` → Catalog | `GET /api/admin/products`, `DELETE /api/admin/products/:id` |
| Edit any product (optional) | — | `PUT /api/products/:id` (admin allowed) |
| List all orders, set fulfillment status | `/admin` → Orders | `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |
| Monitor all group deals | `/admin` → Group deals | `GET /api/admin/deals` |
| Create another admin | — | `POST /api/auth/admin/create` (admin only) |

**Cannot:** Impersonate a customer checkout without logging in as that user (by design).

---

## Customer (buyer)

**Purpose:** Discover products, join group deals, pay (mock), and track orders.

| Capability | UI | API |
|------------|----|-----|
| Register / login | `/register`, `/login` | `POST /api/auth/register`, `POST /api/auth/login` |
| Account summary | `/account` | `GET /api/customer/me`, `GET /api/customer/deals` |
| Browse & search | `/` | `GET /api/products` |
| Product detail, deals, buy flow | `/product/:id`, `/payment` (sign-in required for deals/checkout) | `GET /api/products/:id`, `POST /api/deals/create`, `POST /api/deals/join/:dealId` (identity from session), `POST /api/orders/create` |
| Order history | `/orders` | `GET /api/customer/orders` or `GET /api/orders/user/:userId` (self only) |

**Cannot:** Create or edit products; access admin or seller dashboards; view other users’ orders.

---

## Seller / Vendor

**Purpose:** Maintain their own catalog only.

| Capability | UI | API |
|------------|----|-----|
| Seller dashboard | `/vendor/products` (nav: **Seller**) | `GET /api/products/mine?limit=&skip=` |
| Create listing | Same | `POST /api/products` |
| Edit own listing | Same | `PUT /api/products/:id` |
| Delete own listing | Same | `DELETE /api/products/:id` |
| Same account hub as buyers | `/account` | `GET /api/customer/me` |

**Cannot:** Change another vendor’s products; access admin routes; change platform-wide order status (unless they are also an admin user).

---

## Authentication

- JWT is stored in an **httpOnly cookie** (`accessToken`).
- Frontend axios uses `withCredentials: true` so cookies are sent to `/api/*`.

## Pagination

- Admin list endpoints and seller `GET /api/products/mine` return `{ items, total, limit, skip }` for large catalogs.
