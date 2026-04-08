![Logo](./frontend/src/assets/images/logo/Logo-Long.png)

Vitesse is a full-stack CRM/ERP application built for self-employed professionals and small businesses.
It manages the complete business workflow from customers and quotes to invoices, payments, and real-time analytics.

Built with Node.js and MongoDB on the backend, and React, TypeScript with Vite on the frontend.

📘 Author notes: See [AUTHOR_NOTES.md](/AUTHOR_NOTES.md) for the motivation, background, and design decisions behind this project.

### LiveDemo: [View on Railway](https://vitesse-crm-frontend-production.up.railway.app)

***Demo credentials***: `demo@vitesse.app` / `demo123`

> ⚠️ Note: The live demo is optimized for desktop. Mobile / small-screen layout is not supported yet.

---

###  📊 Features

- Customer & company management
- Quotes with automatic totals, expiry tracking, and state machine enforcement
- Invoices must originate from accepted quotes (one-to-one enforced), with status enforcement (draft → sent → partially_paid → paid) and overdue detection
- Payments (partial, multiple, multi-method) with overpayment prevention — immutable once recorded
- Revenue tracking and outstanding balances
- Dashboard with KPIs and revenue overview
- Multi-tenancy with tenant-scoped data isolation
- Role-based access control (owner vs. member permission matrix per resource)
- Activity stream — business events auto-recorded, notes attachable to any entity
- Secure authentication (JWT with embedded tenant context, bcrypt)
- Input sanitization, rate limiting, and error handling

---

![Dashboard](./screenshots/dashboard.png)

---

## ⚙️ Tech Stack

### Backend
- Node.js (ES Modules), Express.js
- MongoDB, Mongoose
- JWT authentication, bcryptjs
- Security: Helmet, express-rate-limit, mongo-sanitize, sanitize-html, express-validator
- Utilities: Morgan, dayjs, dotenv, compression

### Frontend
- React, TypeScript, Vite
- Ant Design, Tailwind CSS
- Zustand, React Router
- Axios
- React Hook Form, Zod

---

## 🏗 Architecture Overview

Vitesse is built as a clear frontend / backend split with strict responsibility boundaries.

👉 See [Architecture.md](/Architecture.md)

### Backend
- REST API built with Express (ES Modules)
- MongoDB with Mongoose models
- Multi-tenant data isolation — all queries scoped by tenant
- Stateless authentication via JWT with embedded tenant context and membership role
- RBAC enforced at the route level via permission middleware
- All business queries are scoped by tenant — cross-tenant access is impossible by design
- Domain rules enforced server-side (state machines, immutability guards, business constraints)

Key backend responsibilities:
- Sanitize all input
- Enforce domain rules (invoice origination, state machines, payment immutability)
- Protect all resources with auth and permission middleware
- Return generally consistent API errors

### Frontend
- React + TypeScript SPA
- API layer isolated from UI components
- Global auth state managed with Zustand
- Forms validated with React Hook Form + Zod
- Ant Design used for layout and components

Critical domain rules (invoice creation, status transitions, payment immutability) are enforced by the backend, not the UI.

---

## 🧪 Testing Strategy

This project includes automated tests on both backend and frontend.

### Backend unit and integration tests
- Jest + Supertest
- mongodb-memory-server for isolated test database
- Auth flow tested (register, login, protected routes, tenant membership role in JWT)
- CRUD endpoints tested with tenant isolation
- Business rules tested (state machines, immutability, invalid operations)
- RBAC tested (owner vs. member permission boundaries)
- Activity stream tested (event recording, note creation, tenant scoping)

Backend tests cover:
- Auth flow, protected routes, and membership role embedding
- Core CRUD with tenant isolation
- Quote and invoice state machine transitions
- Invoice origination constraints (accepted quotes only, one-to-one)
- Dashboard aggregation and edge cases
- Tax-inclusive payment scenarios and overpayment prevention
- RBAC permission boundaries between owner and member roles
- Activity events and notes

### Frontend component tests
- Vitest + React Testing Library
- User-focused tests (not implementation details)
- Login form validation tested
- Customer list rendering tested with mocked API

Frontend tests ensure:
- Critical user flows work as expected
- UI logic is stable during refactors

---

## 🔁 Continuous Integration

The project includes a GitHub Actions CI pipeline that runs on every push and pull request.

CI checks:
- Backend tests
- Frontend tests

This ensures tests pass on every push.

---

## 🐳 Run with Docker

```bash
Start: docker compose up --build

Frontend: http://localhost:5173

Backend: http://localhost:8888

Stop: docker compose down
```
---
## 🌱 Demo Data

You can populate the database with demo data for quick evaluation.

Demo credentials:
- Email: demo@vitesse.app
- Password: demo123

Seed database:
```bash
# Local development
cd backend && npm run seed

# Docker
docker compose exec backend node scripts/seed.js
```
---
##  Installation
👉 See [SETUP.md](SETUP.md) for full setup instructions.
