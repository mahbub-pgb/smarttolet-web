# Smart To-Let — Web Apps

Two React (Vite) front-ends for the Smart To-Let API:

| App      | Folder    | Dev URL                 | Purpose                                  |
| -------- | --------- | ----------------------- | ---------------------------------------- |
| Client   | `client/` | http://localhost:3000   | Public site: browse, sign up/in, post listings |
| Admin    | `admin/`  | http://localhost:3001   | Staff panel: dashboard, moderation, users, settings |

Both talk to the backend API at `http://localhost:5000/api/v1` (configurable via
each app's `.env` → `VITE_API_URL`).

## Prerequisites

1. The **backend** (the `SmartTolet` project) running: `npm run dev` (port 5000),
   with MongoDB and Redis up.
2. Seed an admin account once: in the backend folder run `npm run seed:admin`.
   Default super-admin login (from backend config / `.env`):
   - identifier: `admin@smarttolet.com` (or mobile `+8801700000000`)
   - password: `ChangeMe123!`

## Run

```bash
# Client
cd client
npm install
npm run dev      # http://localhost:3000

# Admin (separate terminal)
cd admin
npm install
npm run dev      # http://localhost:3001
```

## OTP in testing

In non-production the backend uses a **fixed OTP `123456`** (and also returns it
in the API response as `devOtp`), so you can sign up without a live SMS gateway.
The sign-up screen pre-fills it automatically. In production
(`NODE_ENV=production`) a real random OTP is generated and sent via SMS.

## Sign-up flow (client)

1. Enter a Bangladesh mobile number (`+8801XXXXXXXXX`).
2. Enter the OTP (`123456` in test mode — pre-filled).
3. Complete profile (full name + password) → you're logged in.

## Posting a listing

Authenticated users can post via **+ Post Listing**. Images upload to Cloudinary
through the backend (configure Cloudinary in admin Settings or backend `.env`;
without it, image upload will error — you can still post with no images).
New listings enter the moderation queue and appear publicly once an admin
approves them in the Admin panel.
