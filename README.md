# Hospital OPD Queue Management System

Patients take a token for a department, track their position and estimated wait live, and see the queue on a waiting-hall screen. Doctors call patients (emergency and senior citizens first) and admins view analytics.

## Features
- Department-wise queues with codes like `GM-007`
- Concurrency-safe token numbers (atomic MongoDB counter)
- Priority queue: emergency, senior citizen, normal
- Real-time updates with Socket.io, plus a TV display board at `/display`
- Estimated wait time per patient
- JWT login with roles (admin, staff), bcrypt password hashing
- Analytics dashboard: tokens per day/department, average wait time (admin only)
- Security: helmet, rate limiting, input validation, role-based access
- Automated tests (Jest, Supertest, in-memory MongoDB)

## Tech stack
Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, React (Vite), React Router, Axios, Recharts, Jest

## Folder structure
```
backend/
  app.js, server.js
  src/ config, models, controllers, routes, middleware, validators, utils, socket.js, seed.js
  tests/api.test.js
frontend/
  src/ api, context, components, hooks, pages
```

## Run locally
```
cd backend && npm install
copy .env.example .env      (set MONGO_URI and JWT_SECRET)
npm run seed -- --reset
npm run dev

cd frontend && npm install && npm run dev
```
Open http://localhost:5173. Logins: admin / admin123 and staff / staff123 (change them in `.env` before seeding).

## Tests
`cd backend && npm test` (the first run downloads a temporary MongoDB, so it needs internet).

## Deploy (Render + MongoDB Atlas, one service)
1. Push the project to GitHub (`.env` is already git-ignored).
2. Render: New > Web Service > connect the repo.
3. Build command: `npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend`
4. Start command: `node backend/server.js`
5. Environment variables: `MONGO_URI`, `JWT_SECRET` (long random), `NODE_ENV=production`, `TZ=Asia/Kolkata`
6. Atlas: Network Access must allow the server (Allow access from anywhere is fine for a demo).
7. Run `npm run seed` once against the Atlas database from your laptop (same `MONGO_URI` in your local `.env`).
Free Render services sleep when idle, so the first request can take about 30 seconds.

## API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/login | public (rate limited) |
| GET | /api/departments, /api/departments/display | public |
| POST | /api/tokens | public (validated, rate limited) |
| GET | /api/tokens/:id | public |
| GET | /api/tokens, /api/doctors | admin, staff |
| PATCH | /api/tokens/call-next, /api/tokens/:id/status | admin, staff |
| GET | /api/analytics | admin |

## Known limitations and next steps
Emergency priority is self-selected (a real hospital would use triage staff); single-server Socket.io (use a Redis adapter to scale); SMS alerts.
