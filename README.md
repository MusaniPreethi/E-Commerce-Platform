# E-Commerce

Full-stack marketplace demo: **Express** + **MongoDB** API with **React (Vite)** storefront. Customers browse and buy, vendors manage listings, admins oversee users, catalog, orders, and group deals. Auth uses **JWT in an httpOnly cookie** (`withCredentials` on the client).

**Repository:** [github.com/iamdwaseem/E-COMMERCE](https://github.com/iamdwaseem/E-COMMERCE)

## Tech stack

- **Backend:** Node.js (ES modules), Express, Mongoose, bcryptjs, jsonwebtoken, cookie-parser, cors  
- **Frontend:** React 19, React Router 7, Axios, Vite 5  
- **Database:** MongoDB

## Prerequisites

- Node.js 18+ recommended  
- A running **MongoDB** instance (local or Atlas)

## Setup

### 1. Environment

From the project root:

```bash
cp .env.example .env
```

Edit `.env` and set at least `MONGO_URI` and a strong `JWT_SECRET`. Optional `CLIENT_ORIGIN` for CORS when the API and UI run on different origins.

### 2. API (root)

```bash
npm install
npm run seed    # optional: demo users + products (see .env.example for seed vars)
npm run dev     # or: npm start
```

API defaults to **port 5000** (`PORT` in `.env`).

### 3. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite dev server proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.js`). Open the URL Vite prints (usually `http://localhost:5173`).

### Production build (frontend)

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` assets with your host of choice and configure the same origin or proxy so `/api` reaches the Express app.

## Features (high level)

- Register / login; roles: **customer**, **vendor**, **admin**  
- Home: product grid with **search** (`q`), **category** filter, and **pagination**  
- Sidebar: categories from the API, account and role-based links  
- Product detail, mock checkout, orders, group deals  
- Vendor dashboard for own listings (including **category** per product)  
- Admin console for users, catalog, orders, deals  

For route-by-route detail, see **[ROLES.md](./ROLES.md)**.

## Public product API (pagination)

`GET /api/products` returns a paginated object:

```json
{ "items": [], "total": 0, "limit": 24, "skip": 0 }
```

Query parameters include `limit`, `skip`, optional `category`, and optional `q` (search on name/description).  
`GET /api/products/categories` returns distinct category names for the sidebar.

## Scripts (root)

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev` | API with `--watch`             |
| `npm start`   | Run API once                   |
| `npm run seed`| Seed demo data (MongoDB)       |

## License

Private / educational use unless otherwise specified by the author.
