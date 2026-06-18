# Smart To-Let — Web App

A **single** React (Vite) front-end that serves both the public site **and** the
admin panel. One dev server, one build.

| Area   | Path        | Who                                   |
| ------ | ----------- | ------------------------------------- |
| Public | `/`         | Everyone (browse, sign up/in, post listings) |
| Admin  | `/admin/*`  | Staff only (dashboard, moderation, users, settings) |

> The old separate `admin/` app has been merged into `client/`. You can stop its
> dev server and delete the `admin/` folder — it's no longer used.

Talks to the backend API at `http://localhost:5000/api/v1` (set per-app in
`client/.env` → `VITE_API_URL`).

## Prerequisites

1. Backend running: in the `SmartTolet` project, `npm run dev` (port 5000), with
   MongoDB and Redis up.
2. A staff account exists: `npm run seed:admin` in the backend.
   Default super-admin: `admin@smarttolet.com` (or `+8801700000000`) / `ChangeMe123!`.

## Run (one server)

```bash
cd client
npm install
npm run dev      # http://localhost:3000
```

## Role-based routing

There is **one** sign-in form (`/signin`). After signing in:

- **Staff** (moderator / admin / super_admin) → redirected to **`/admin`** (the panel).
- **Everyone else** → the public site (`/`).

Staff can jump back to the public site from the sidebar ("View public site"), and
a signed-in staff user also sees an "Admin Panel" link in the public navbar.
Non-staff who try to open `/admin/*` are bounced to the public site.

## OTP in testing

Non-production uses a fixed OTP **`123456`** (also returned as `devOtp`), so you
can sign up with no SMS gateway. The sign-up screen pre-fills it.

## Listing URLs

Single-listing pages use the **post title as a slug** instead of the raw id,
e.g. `/listings/beautiful-flat-in-dhanmondi-3cb40a`. The backend generates the
slug from the title (with a short stable suffix for uniqueness) and resolves
either a slug or an id.

## Images

Image uploads go to Cloudinary when configured; otherwise, in development they
fall back to local disk (served from the backend at `/uploads`). You can post
listings without images at any time.
