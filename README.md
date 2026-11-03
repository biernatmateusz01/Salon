# Salon — Barber & Beauty PWA

Booking app for a barber shop or beauty salon, with a client side and an admin side.

- **frontend/**: Next.js 16 (App Router, React 19, Tailwind 4), installable PWA
- **backend/**: Node.js + Express 5 REST API, SQLite via the built-in `node:sqlite` (no native deps)

## Quick start

Requires Node.js 22.13+ (tested on 24).

```bash
npm run install:all
npm run dev
```

- App: http://localhost:3000 (the frontend proxies `/api/*` to the backend)
- API: http://localhost:4000

A default admin is created on first run: `admin@salon.local` / `admin123`.
Change it with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` (see `backend/.env.example`) **before** the first start.

## Features

**Clients**
- Browse services, prices and opening hours
- 3-step booking: service → day → free time slot (live availability, no double-booking)
- "My visits": upcoming visits with cancel, plus history

**Admin** (`/admin`)
- Calendar with day/week views, opening-hours shading and a "now" line
- Click an empty slot to book; create walk-in clients on the fly
- Click an appointment to complete it, mark a no-show, cancel or reschedule
- Client list with search, notes, visit history and total spent
- Manage services (name, duration, price, hide/show)

**Languages** — Polish, English, Spanish, Russian
- URLs carry the language (`/pl/book`, `/en/book`…); `src/proxy.ts` redirects `/` using the saved choice, then the browser's language
- Language switcher in the header; the choice is saved in a cookie and on the user's account
- Translations live in `frontend/src/i18n/dictionaries/*.ts` (add a key to `en.ts` and TypeScript flags the other files)
- API errors return a `code` that the frontend translates

**24h reminders** — email (any SMTP server) and SMS ([SMSAPI.pl](https://www.smsapi.pl))
- The backend checks every 5 minutes and sends each booked visit one reminder in the client's language
- Rescheduling a visit re-arms its reminder
- Without SMTP/SMSAPI credentials, messages are only printed to the API console (safe for local dev)
- Check your settings: `npm --prefix backend run notify:test -- --email you@example.com --phone 500600700 --locale pl`

**PWA**
- Web app manifest with generated icons (`src/app/manifest.ts`, `icon-*.png` routes)
- Service worker (`public/sw.js`): caches static assets, network-first pages with an offline fallback; API calls are never cached. Registered only in production builds.
- Mobile tab bar, safe-area insets, light/dark theme

To test install/offline behaviour: `npm run build && npm start`.

## Configuration

| Where | Variable | Default |
| --- | --- | --- |
| backend | `API_PORT` | `4000` |
| backend | `JWT_SECRET` | `dev-secret-change-me` (**change in production**) |
| backend | `DB_PATH` | `backend/data/salon.db` |
| backend | `CORS_ORIGIN` | `http://localhost:3000` |
| backend | `SALON_NAME`, `SALON_ADDRESS` | used in reminder messages |
| backend | `DEFAULT_LOCALE` | `pl` (language for clients added by the salon) |
| backend | `REMINDERS_ENABLED`, `REMINDER_HOURS_BEFORE` | `true`, `24` |
| backend | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | email; empty = console only |
| backend | `SMSAPI_TOKEN`, `SMSAPI_FROM`, `SMSAPI_TEST` | SMS; empty = console only |
| frontend | `API_URL` | `http://localhost:4000` |

Opening hours and slot length live in `backend/src/config.js`.

## API overview

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET/PATCH | `/api/auth/me` (PATCH: `{ locale }`) | signed in |
| GET | `/api/services` | public |
| POST/PUT/DELETE | `/api/services/:id?` | admin |
| GET | `/api/appointments/availability?date=&serviceId=` | public |
| GET/POST | `/api/appointments` | client (own) / admin (all) |
| PATCH | `/api/appointments/:id` | client: cancel own; admin: status, time, service |
| GET/POST/PUT/DELETE | `/api/clients/:id?` | admin |

Times are stored as local wall-clock strings (`YYYY-MM-DDTHH:mm`), which suits a single-location salon.
