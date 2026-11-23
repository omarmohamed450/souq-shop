# Souq — Full-Stack Online Store

A full-stack e-commerce application built with **Node.js / Express / MongoDB** on the backend and **Angular 22** (with SSR support) on the frontend.

The store lets customers browse items by category, search and view item details, manage favorites and a cart, and check out through Stripe. Managers get a protected dashboard to manage categories, items, orders, email templates, outgoing emails, and store settings (including Stripe and SMTP credentials).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB |
| Auth | JWT + bcrypt |
| Frontend | Angular 22, TypeScript, Tailwind CSS 4 |
| Rendering | Angular SSR (client-rendered routes) |
| Payments | Stripe |
| Email | Nodemailer (SMTP) |

## Project Structure

```
.
├── src/                  # Express API
│   ├── config/           # DB connection
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Auth, validation, errors, uploads
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utilities/        # Helpers (tokens, encryption, files)
│   └── validations/      # express-validator rules
├── scripts/              # Seed scripts
├── uploads/              # Uploaded item images (served at /uploads)
├── docs/                 # API documentation and sprint notes
└── client/web-angular/   # Angular application
```

## Prerequisites

- Node.js 20+ (developed on Node 24)
- MongoDB running locally or a MongoDB Atlas connection string

## Getting Started

### 1. Backend

```bash
# install dependencies
npm install

# create your environment file
cp .env.example .env
# then edit .env and set MONGO_URI and JWT_SECRET

# (optional) create the default manager account and demo data
npm run seed
npm run seed:demo
npm run seed:email-templates

# run in development (nodemon)
npm run dev

# or run normally
npm start
```

The API runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd client/web-angular
npm install
npm start
```

The Angular dev server runs on `http://localhost:4200` and proxies `/api` and `/uploads` to `http://localhost:5000` (configured in `client/web-angular/proxy.conf.json` and wired up in `angular.json`).

### Default Manager Account (development seed)

- Username: `admin`
- Password: `password`

Change these through the manager dashboard before using the project outside local development. You can also override them with `ADMIN_USERNAME` / `ADMIN_PASSWORD` before running `npm run seed`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `ADMIN_USERNAME` | Optional seed username |
| `ADMIN_PASSWORD` | Optional seed password |

Stripe keys and SMTP credentials are **not** stored in `.env`. Managers configure them from the dashboard, and they are stored (encrypted) in the database.

## API Documentation

See [`docs/api-endpoints.md`](docs/api-endpoints.md) for the full list of endpoints, request bodies, and response shapes.

Health check: `GET /api/test`

## Production Build

```bash
# backend
npm start

# frontend
cd client/web-angular
npm run build
npm run serve:ssr:web-angular   # serves the SSR build on port 4000 by default
```

If you serve the Angular SSR build and the API from different ports, make sure `/api` and `/uploads` are proxied to the backend.

## Notes

- Uploaded images are stored in `uploads/` and served at `/uploads/...`. Their contents are ignored by git; only the folder is kept.
- The Angular dev server only proxies API calls when the proxy configuration is active. It is enabled in `angular.json`, so both `npm start` and a plain `ng serve` work.
- Never commit your `.env` file or any real secrets.
