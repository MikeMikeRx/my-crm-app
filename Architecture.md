# Architecture Documentation

> **Vitesse CRM** - A full-stack CRM application for managing customers, quotes, invoices, and payments.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [API Design](#api-design)
- [Authentication & Authorization](#authentication--authorization)
- [Multi-Tenancy & RBAC](#multi-tenancy--rbac)
- [Activity Tracking](#activity-tracking)
- [Frontend Architecture](#frontend-architecture)
- [Security](#security)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Deployment](#deployment)

---

## Overview

This is a **monorepo** containing a React frontend and Node.js backend with clear separation of concerns. Each layer is independently deployable and communicates via REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                      │
│                    Port: 5173 (dev/prod)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API (JSON)
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│                       Port: 8888                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│                       Port: 27017                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
vitesse-crm/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # API client and endpoint modules
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Zustand auth store
│   │   ├── pages/            # Page components
│   │   ├── routes/           # React Router configuration
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Helper functions
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Request handlers
│   │   │   ├── dashboard/    # Dashboard-specific controllers
│   │   │   └── noteController.js  # Manual note creation
│   │   ├── middleware/       # Auth, validation, error handling
│   │   │   └── permissions.js     # RBAC permission matrix + requirePermission()
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── Tenant.js     # Tenant (organisation) entity
│   │   │   ├── Membership.js # User ↔ Tenant with role
│   │   │   └── Activity.js   # Activity stream (events + notes)
│   │   ├── routes/           # Express route definitions
│   │   │   └── activity.js   # POST /api/activities/notes
│   │   ├── services/         # Business logic and aggregation
│   │   │   ├── activity/     # createActivity() — fire-and-forget event recorder
│   │   │   └── dashboard/    # Dashboard aggregation services
│   │   └── utils/            # Async handler, status helpers, financial calculations
│   │       └── dashboard/    # Dashboard-specific utilities
│   ├── tests/                # Jest + Supertest tests
│   └── package.json
│
├── docker-compose.yml        # Full stack orchestration
├── .github/workflows/        # CI/CD pipeline
└── README.md
```

**Decision: Monorepo over separate repositories**
- Simplifies local development with single `docker-compose up`
- Atomic commits across frontend and backend
- Shared documentation and CI/CD configuration

---

## Technology Stack

### Frontend

| Technology | Version | Purpose | Decision Rationale |
|------------|---------|---------|-------------------|
| React | 19.1.1 | UI Framework | Industry standard, large ecosystem |
| TypeScript | 5.9.3 | Type Safety | Catch errors at compile time |
| Vite | 7.1.7 | Build Tool | Fast HMR, modern ESM-first bundling |
| Ant Design | 5.28.0 | UI Components | Enterprise-ready, comprehensive component library |
| Tailwind CSS | 4.1.16 | Styling | Utility-first, rapid UI development |
| Zustand | 5.0.8 | State Management | Lightweight alternative to Redux |
| React Router | 7.9.5 | Routing | Standard React routing solution |
| React Hook Form | 7.66.0 | Forms | Performant, minimal re-renders |
| Zod | 4.1.12 | Validation | TypeScript-first schema validation |
| Axios | 1.13.1 | HTTP Client | Interceptors for auth headers |

**Decision: Zustand over Redux**
- Minimal boilerplate for simple auth state
- Only global state needed is user authentication
- Page-level state managed with React hooks

**Decision: Ant Design over Material UI**
- Better suited for data-heavy CRM interfaces
- Built-in Table, Form, and Modal components
- Consistent enterprise look and feel

### Backend

| Technology | Version | Purpose | Decision Rationale |
|------------|---------|---------|-------------------|
| Node.js | 20.x | Runtime | LTS version, ES modules support |
| Express | 5.1.0 | Web Framework | Mature, extensive middleware ecosystem |
| MongoDB | 7.x | Database | Flexible schema for CRM entities |
| Mongoose | 8.19.2 | ODM | Schema validation, virtuals, refs |
| JWT | 9.0.2 | Authentication | Stateless, scalable auth |
| bcryptjs | 3.0.2 | Password Hashing | Secure password storage |
| Helmet | 8.1.0 | Security Headers | Protection against common attacks |

**Decision: MongoDB over PostgreSQL**
- CRM entities (quotes, invoices) have variable line items
- Document model matches JSON API responses naturally
- Easier schema evolution as requirements change

**Decision: Express over Fastify/NestJS**
- Simple REST API doesn't need complex framework
- Team familiarity with Express patterns
- Extensive middleware ecosystem

---

## Data Model

### Business Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│   User   │─────►│ Customer │─────►│  Quote   │─────►│ Invoice  │─────►│ Payment  │
└──────────┘      └──────────┘      └──────────┘      └──────────┘      └──────────┘
   creates           for a           converts to       receives
   customer         customer          invoice          payment

All entities above belong to a Tenant. Users access a tenant via a Membership (with a role).
Business events and user notes are recorded in Activity entries linked to any entity.
```

### Entity Relationship Diagram

```
┌──────────────┐        ┌──────────────┐
│     User     │        │    Tenant    │
│──────────────│        │──────────────│
│ _id          │        │ _id          │
│ name         │        │ name         │
│ email        │        │ slug (unique)│
│ password     │        │ owner ───────┼──► User
│ role         │        └──────────────┘
└──────┬───────┘               │
       │                       │ linked via
       │ member of (N:M)       ▼
       ├──────────────►┌──────────────┐
       │               │  Membership  │
       │               │──────────────│
       │               │ user ────────┼──► User
       │               │ tenant ──────┼──► Tenant
       │               │ role         │  "owner"|"member"
       │               └──────────────┘
       │
       │ scoped to Tenant
       ▼
┌──────────────┐
│   Customer   │
│──────────────│
│ _id          │
│ user ────────┼──► User
│ tenant ──────┼──► Tenant
│ name         │
│ email        │
│ phone        │
│ company      │
│ address      │
└──────┬───────┘
       │
       │ has (1:N)
       ▼
┌──────────────┐
│    Quote     │
│──────────────│
│ _id          │
│ user ────────┼──► User
│ tenant ──────┼──► Tenant
│ customer ────┼──► Customer
│ quoteNumber  │
│ items[]      │
│ status       │
│ totals (virtual)
└──────┬───────┘
       │
       │ converts to (1:1)
       ▼
┌──────────────┐
│   Invoice    │
│──────────────│
│ _id          │
│ user ────────┼──► User
│ tenant ──────┼──► Tenant
│ customer ────┼──► Customer
│ quote ───────┼──► Quote (optional)
│ invoiceNumber│
│ items[]      │
│ status       │
│ totals (virtual)
└──────┬───────┘
       │
       │ receives (1:N)
       ▼
┌──────────────┐
│   Payment    │
│──────────────│
│ _id          │
│ user ────────┼──► User
│ tenant ──────┼──► Tenant
│ invoice ─────┼──► Invoice
│ paymentId    │
│ amount       │
│ paymentMethod│
│ status       │
└──────────────┘

Activity entries are linked to any of the above business entities:

┌──────────────────┐
│     Activity     │
│──────────────────│
│ tenant ──────────┼──► Tenant
│ user ────────────┼──► User
│ entityType       │  "customer"|"quote"|"invoice"|"payment"
│ entityId ────────┼──► (entity)
│ type             │  "event" | "note"
│ action           │  e.g. "quote_sent", "note_added"
│ message          │
│ metadata         │  (optional structured context)
└──────────────────┘
```

### Collections

**User**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed, excluded from queries),
  role: "admin" | "user",
  createdAt: Date,
  updatedAt: Date
}
```

**Tenant**
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique, lowercase),   // URL-safe identifier
  owner: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Membership**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  tenant: ObjectId (ref: Tenant),
  role: "owner" | "member",           // Controls RBAC permissions
  createdAt: Date,
  updatedAt: Date
  // Unique compound index: { user, tenant }
}
```

**Customer**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  tenant: ObjectId (ref: Tenant),     // Tenant scope
  name: String,
  email: String,
  phone: String,
  company: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Quote**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  tenant: ObjectId (ref: Tenant),
  customer: ObjectId (ref: Customer),
  quoteNumber: String (unique, assigned — validated; uniqueness enforced),
  issueDate: Date,
  expiryDate: Date,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    taxRate: Number (percentage)
  }],
  notes: String (optional),
  status: "draft" | "sent" | "accepted" | "declined" | "expired" | "converted",
  // Virtual: totals { subtotal, tax, total }
}
```

**Invoice**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  tenant: ObjectId (ref: Tenant),
  customer: ObjectId (ref: Customer),
  quote: ObjectId (ref: Quote, required, unique),
  invoiceNumber: String (unique, assigned — validated; uniqueness enforced),
  issueDate: Date,
  dueDate: Date,
  items: [{ description, quantity, unitPrice, taxRate }],
  notes: String (optional),
  status: "draft" | "sent" | "partially_paid" | "paid",
  // "overdue" derived at read-time via resolveInvoiceStatus() — not stored
  // Virtual: totals { subtotal, tax, total }
}
// Constraints:
// - Invoice must originate from an accepted quote (quote is required)
// - One invoice per quote enforced by unique index on the quote field
```

**Payment**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  tenant: ObjectId (ref: Tenant),
  invoice: ObjectId (ref: Invoice),
  paymentId: String (unique),
  amount: Number,
  paymentDate: Date,
  paymentMethod: "cash" | "card" | "bank_transfer" | "paypal",
  status: "pending" | "completed" | "failed"
}
// Immutability: payments have no update or delete routes.
// Corrections are made by recording new entries, never by modifying existing ones.
```

**Activity**
```javascript
{
  _id: ObjectId,
  tenant: ObjectId (ref: Tenant),
  user: ObjectId (ref: User),
  entityType: "customer" | "quote" | "invoice" | "payment",
  entityId: ObjectId,                // Ref to the entity above
  type: "event" | "note",
  action: String,                    // e.g. "quote_sent", "payment_recorded", "note_added"
  message: String,
  metadata: Mixed (optional),        // Structured context, e.g. { previousStatus, newStatus }
  createdAt: Date,
  updatedAt: Date
  // Index: { tenant, entityType, entityId }
}
```

**Decision: Virtual properties for totals**
- Quote and Invoice totals are computed from line items
- Avoids data duplication and sync issues
- Calculated on JSON serialization via Mongoose virtuals

**Decision: Tenant isolation via tenant field**
- Every entity includes a `tenant` reference; controllers scope all queries by `{ tenant: req.tenant.id }`
- `user` is kept only as actor/creator linkage, not for data scoping
- Enables multi-tenant SaaS with strict cross-tenant data isolation

---

## API Design

### REST Principles

- **Resource-based URLs**: `/api/customers`, `/api/quotes/:id`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **JSON Request/Response**: All payloads are JSON
- **Stateless**: Authentication via JWT Bearer token

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, receive JWT | No |
| POST | `/api/auth/demo` | Login as demo account (seeds sample data) | No |
| GET | `/api/auth/profile` | Get current user | Yes |
| GET | `/api/customers` | List user's customers | Yes |
| GET | `/api/customers/:id` | Get customer by ID | Yes |
| POST | `/api/customers` | Create customer | Yes |
| PUT | `/api/customers/:id` | Update customer | Yes |
| DELETE | `/api/customers/:id` | Delete customer | Yes |
| GET | `/api/quotes` | List quotes | Yes |
| GET | `/api/quotes/:id` | Get quote | Yes |
| POST | `/api/quotes` | Create quote | Yes |
| PUT | `/api/quotes/:id` | Update quote | Yes |
| PATCH | `/api/quotes/:id/status` | Transition quote status (state machine) | Yes |
| DELETE | `/api/quotes/:id` | Delete quote (blocked if converted) | Yes |
| GET | `/api/invoices` | List invoices | Yes |
| GET | `/api/invoices/:id` | Get invoice | Yes |
| POST | `/api/invoices` | Create invoice | Yes |
| PUT | `/api/invoices/:id` | Update invoice (draft only) | Yes |
| PATCH | `/api/invoices/:id/status` | Transition invoice status (state machine) | Yes |
| DELETE | `/api/invoices/:id` | **Disabled** — exposed only in controller; not mounted at route level | Yes |
| GET | `/api/payments` | List payments | Yes |
| POST | `/api/payments` | Record payment | Yes |
| PUT/DELETE | `/api/payments/:id` | **Disabled** — payments are immutable for financial integrity | Yes |
| GET | `/api/dashboard/summary` | Dashboard KPIs | Yes |
| GET | `/api/admin/stats` | Admin statistics | Admin |
| POST | `/api/activities/notes` | Add a note to any entity | Yes (write) |
| GET | `/health` | Health check | No |

### Response Format

There is no single enforced envelope. Responses vary by endpoint:

```javascript
// Auth endpoints — direct shape
{ token, user: { id, name, email, role }, tenant: { id, name, slug } }

// Business entity endpoints — direct document or array
// e.g. GET /api/quotes returns the array directly
// e.g. POST /api/quotes returns the created document

// Simple success acknowledgements
{ message: "..." }

// Error (consistent across all routes)
{
  "message": "Error description",
  "errors": { "field": ["validation error"] },  // Validation errors only
  "stack": "..."                                  // Development only
}
```

**Decision: REST over GraphQL**
- Simpler implementation for CRUD operations
- Easier to secure and rate-limit
- Team expertise in REST patterns
- GraphQL benefits (flexible queries) not critical for this use case

---

## Authentication & Authorization

### JWT Flow

```
┌────────┐                              ┌─────────┐                    ┌──────────┐
│ Client │                              │ Backend │                    │ MongoDB  │
└───┬────┘                              └────┬────┘                    └────┬─────┘
    │                                        │                              │
    │  POST /api/auth/login                  │                              │
    │  { email, password }                   │                              │
    │───────────────────────────────────────►│                              │
    │                                        │  Find user by email          │
    │                                        │─────────────────────────────►│
    │                                        │◄─────────────────────────────│
    │                                        │                              │
    │                                        │  Verify bcrypt password      │
    │                                        │                              │
    │                                        │  Generate JWT (1 day exp)    │
    │  { token, user }                       │                              │
    │◄───────────────────────────────────────│                              │
    │                                        │                              │
    │  Store token in memory                 │                              │
    │                                        │                              │
    │  GET /api/customers                    │                              │
    │  Authorization: Bearer <token>         │                              │
    │───────────────────────────────────────►│                              │
    │                                        │  Verify JWT signature        │
    │                                        │  Extract user + tenant from  │
    │                                        │  token; check tenant role    │
    │                                        │                              │
    │                                        │  Query with tenant filter    │
    │                                        │─────────────────────────────►│
    │                                        │◄─────────────────────────────│
    │  { data: [...] }                       │                              │
    │◄───────────────────────────────────────│                              │
```

### Token Storage

**Decision: In-memory token storage (not localStorage)**

| Approach | XSS Risk | Persistence | Chosen |
|----------|----------|-------------|--------|
| localStorage | High (accessible via JS) | Survives refresh | No |
| sessionStorage | High | Tab only | No |
| HttpOnly Cookie | Low | Survives refresh | No* |
| In-memory variable | None | Lost on refresh | Yes |

*HttpOnly cookies require CSRF protection and same-origin setup. In-memory was chosen for simplicity with acceptable UX trade-off (re-login on page refresh).

### Role-Based Authorization

```javascript
// Middleware usage
router.get('/admin/stats',
  authMiddleware,           // Verify JWT
  authorizeRoles('admin'),  // Check role
  adminController.getStats
);
```

Roles:
- **user**: Standard access to own data
- **admin**: Access to admin endpoints and all user management

---

## Multi-Tenancy & RBAC

### Tenant Architecture

Every business entity (Customer, Quote, Invoice, Payment, Activity) is scoped to a **Tenant**. Users access a tenant through a **Membership** record that carries a tenant-level role.

The JWT encodes both user-level and tenant-level identity:

```javascript
// JWT payload
{
  id: "user_id",
  email: "user@example.com",
  role: "user" | "admin",         // System-level role
  tenant: "tenant_id",            // Active tenant
  membershipRole: "owner" | "member"  // Tenant-level role
}
```

`authMiddleware` is stateless — it extracts tenant context from the token, requiring no database lookup per request:

```javascript
req.user   = { id, email, role }
req.tenant = { id, role }        // role = membershipRole from JWT
```

### Permission Matrix

`requirePermission(resource, action)` middleware enforces access per resource based on `req.tenant.role`:

| Resource | owner | member |
|----------|-------|--------|
| customers | read, write | read, write |
| quotes | read, write | read, write |
| invoices | read, write | read only |
| payments | read, write | read only |
| dashboard | read | read |
| activities | read, write | read, write |

Members can fully manage customers and quotes but cannot create invoices, record payments, or modify financial data — those are restricted to owners.

```javascript
// Applied at route level:
router.post("/", requirePermission("invoices", "write"), ...)
router.get("/",  requirePermission("invoices", "read"),  ...)
```

---

## Activity Tracking

The `Activity` collection is an activity stream for business events and user notes. It records two types of entries:

| Type | Source | Example |
|------|--------|---------|
| `event` | Auto-recorded by controllers on significant actions | quote sent, invoice paid, payment recorded |
| `note` | Created by users via `POST /api/activities/notes` | "Client confirmed by email" |

### Event Recording

Business controllers call `createActivity()` (a fire-and-forget service) after significant state changes. Failures are logged but never bubble up to the HTTP response:

```javascript
// services/activity/createActivity.js
export async function createActivity({ tenant, user, entityType, entityId, action, message, metadata }) {
  try {
    await Activity.create({ tenant, user, entityType, entityId, type: "event", action, message, metadata });
  } catch (err) {
    console.error("[activity] failed to record:", err.message);
  }
}
```

Events are recorded in: `quoteController`, `invoiceController`, `paymentController`.

### Note Creation

Users can attach free-text notes to any entity via `POST /api/activities/notes`:

```javascript
// Request body
{ "entityType": "invoice", "entityId": "...", "message": "Client confirmed payment by email" }
```

The controller verifies the entity belongs to the user's tenant before writing.

---

## Frontend Architecture

### Component Hierarchy

```
App
├── ConfigProvider (Ant Design theme)
│   └── MobileBlock (desktop-only gate, ≥1024px)
│       └── BrowserRouter
│           └── Routes
│               ├── /login → LoginPage
│               ├── /register → RegisterPage
│               └── /* → ProtectedRoute
│                   └── MainLayout
│                       ├── Sidebar (navigation)
│                       └── Content
│                           ├── /dashboard → DashboardPage
│                           ├── /customers → CustomersPage
│                           ├── /quotes → QuotesPage
│                           ├── /invoices → InvoicesPage
│                           └── /payments → PaymentsPage
```

### State Management Strategy

| State Type | Solution | Example |
|------------|----------|---------|
| Auth/User | Zustand store | `useAuthStore()` |
| Page data | Local useState | Customer list in CustomersPage |
| Form state | React Hook Form | Create/Edit modals |
| UI state | Local useState | Modal open, loading flags |

**Decision: No global data cache (e.g., React Query)**
- Current data fetching pattern is sufficient for app scale
- Each page fetches fresh data on mount
- Future improvement: Add React Query for caching and optimistic updates

### API Layer Pattern

```
src/api/
├── client.ts      # Axios instance with interceptors
├── auth.ts        # login(), register(), getProfile()
├── customers.ts   # getCustomers(), createCustomer(), etc.
├── quotes.ts
├── invoices.ts
├── payments.ts
└── dashboard.ts
```

**Decision: Centralized API layer**
- Single Axios instance with auth interceptor
- Components import from API modules, not axios directly
- Easy to mock for testing
- Consistent error handling

---

## Security

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                 Rate Limiting (configurable)                 │
│              (default: 100 req/min global, 10/min auth)      │
├─────────────────────────────────────────────────────────────┤
│                   Helmet Security Headers                    │
│        (CSP, X-Frame-Options, X-Content-Type-Options)       │
├─────────────────────────────────────────────────────────────┤
│                    Input Sanitization                        │
│            (HTML stripping, MongoDB injection)               │
├─────────────────────────────────────────────────────────────┤
│                  Request Validation                          │
│               (express-validator schemas)                    │
├─────────────────────────────────────────────────────────────┤
│                   Authentication                             │
│                    (JWT verification)                        │
├─────────────────────────────────────────────────────────────┤
│                    Authorization                             │
│            (Role check, tenant isolation)                    │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic                            │
│                    (Controllers)                             │
└─────────────────────────────────────────────────────────────┘
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 10 salt rounds |
| SQL/NoSQL Injection | mongo-sanitize middleware |
| XSS Prevention | sanitize-html, React auto-escaping |
| Rate Limiting | express-rate-limit (configurable via env, default 100/min) |
| Auth Rate Limiting | Configurable via env (default 10 attempts/min) |
| Security Headers | Helmet middleware |
| CORS | Configured for frontend origin |
| Input Validation | express-validator on all routes |
| Demo Guard | Read-only mode for demo account (blocks POST/PUT/PATCH/DELETE) |

---

## Key Architectural Decisions

### 1. No Refresh Tokens

**Context**: JWT tokens expire after 1 day.

**Decision**: Use single access token without refresh mechanism.

**Rationale**:
- Simpler implementation
- Acceptable UX for internal/small team use
- Lower security risk than long-lived tokens
- Trade-off: Users must re-login daily

**Alternative considered**: Refresh token rotation - rejected for complexity.

### 2. Mongoose Virtual Properties

**Context**: Quotes and Invoices need totals (subtotal, tax, total).

**Decision**: Use Mongoose virtuals instead of stored fields.

**Rationale**:
- Single source of truth (line items)
- No sync issues between items and totals
- Computed on JSON serialization
- Trade-off: Slight computation overhead

### 3. MVC Pattern on Backend with Service Layer

**Context**: Need organized code structure for REST API; dashboard aggregation requires non-trivial business logic.

**Decision**: Model-View-Controller with a service layer for complex aggregation.

```
Route → Controller → Service (aggregation) → Model → Database
Route → Controller → Model → Database         (simple CRUD)
```

**Rationale**:
- Simple CRUD routes keep business logic in controllers
- Dashboard and financial aggregation extracted into `services/dashboard/` to keep controllers thin
- `utils/status/*` centralizes status logic across invoices, quotes, and payments

### 4. Financial Data Integrity Guards

**Context**: Payments and invoices represent real financial transactions.

**Decision**: Payments are immutable (no PUT/DELETE routes). Invoices have graduated protections: only draft invoices can be edited; DELETE is disabled at the route level; overpayments are rejected at the payment layer.

**Rationale**:
- Prevents accidental or malicious alteration of financial records
- Consistent with accounting principles — corrections are made via new entries, not deletions
- Invoice fields (items, dates, notes) can only be edited while status is `draft`; any other status returns a 400
- Overpayment check compares the sum of completed payments against the tax-inclusive invoice total before accepting a new payment

### 5. Invoice State Machine

**Context**: Invoices move through a defined lifecycle and should not skip states or regress.

**Decision**: Status transitions are validated server-side via `isValidTransition()` before any update is applied.

```
draft → sent ──────────────────→ paid
              ↘                 ↗
               partially_paid ──
```

Any other transition (e.g. `draft → paid`, `paid → sent`) is rejected with a 400.

`overdue` is not a stored status — it is derived at read-time from `sent | partially_paid` + past due date.

**Rationale**:
- Prevents invalid state hops — `isValidTransition()` is checked before every status write
- A separate `PATCH /:id/status` endpoint keeps status transitions distinct from field edits
- Editing is only allowed in `draft` state; once sent, the invoice is locked for field changes

### 6. Invoice Status Derived at Read-Time

**Context**: An invoice becomes overdue when its due date passes, regardless of when it was last written.

**Decision**: Store only `draft | sent | partially_paid | paid` in the database. Derive `overdue` at read-time via `resolveInvoiceStatus()`.

**Rationale**:
- Avoids stale status data (no background job needed to flip statuses at midnight)
- Status utilities in `utils/status/` (`invoiceStatus.js`, `quoteStatus.js`, `paymentStatus.js`) used consistently by controllers and services
- Trade-off: Slight computation on every read

### 7. Component-Level Data Fetching

**Context**: Pages need to display data from API.

**Decision**: Each page component fetches its own data.

**Rationale**:
- Simple mental model
- No global state synchronization issues
- Trade-off: No caching, refetches on navigation
- Future improvement: Add React Query

### 8. Docker Compose for Development

**Context**: Need consistent development environment.

**Decision**: docker-compose.yml orchestrates all services.

**Rationale**:
- One command to start entire stack
- Matches production-like environment
- Database data persisted in named volume
- Easy onboarding for new developers

### 9. Multi-Tenancy via Tenant Field + JWT Embedding

**Context**: The system needs to support multiple users sharing an organisation's data without cross-tenant data leakage.

**Decision**: Every business entity carries a `tenant` field. The active tenant and membership role are embedded in the JWT so every request is fully identified without a DB round-trip.

**Rationale**:
- Stateless auth middleware — no membership lookup on every request
- All queries are scoped by `{ tenant: req.tenant.id }` — impossible to accidentally return cross-tenant data
- Enables future multi-tenant SaaS expansion without architectural changes
- Trade-off: Token must be re-issued if the user's membership role changes

### 10. Tenant-Level RBAC via Permission Matrix

**Context**: Different users within a tenant should have different capabilities (e.g. members can create quotes but not invoices).

**Decision**: A static permission matrix in `permissions.js` maps `(resource, role) → [actions]`. `requirePermission()` is applied at the route level.

**Rationale**:
- Centralised, readable permission definition
- Enforced at the HTTP boundary — no business logic needed inside controllers
- Easy to extend: add a resource row or a new role column
- Trade-off: Permissions are static per role, not per-user configurable

### 11. Activity Tracking as a Fire-and-Forget Service

**Context**: The application records business events (quote sent, payment recorded) and user notes for audit and context purposes.

**Decision**: `createActivity()` wraps `Activity.create()` in a try/catch and swallows failures silently. Controllers call it after their own writes succeed.

**Rationale**:
- Activity recording is non-critical — a logging failure should never fail an invoice creation
- Keeps controllers clean: one line call, no error propagation
- Both event types (`event` auto-generated, `note` user-created) live in the same collection with a `type` discriminator, simplifying future feed/timeline queries
- Trade-off: Failed event writes are invisible to the caller; errors are console-logged only

### 12. Quote Status State Machine (Mirroring Invoice)

**Context**: Like invoices, quotes move through a defined lifecycle and should not skip or regress states.

**Decision**: A dedicated `PATCH /:id/status` endpoint validates transitions before applying them.

```
draft → sent ──────────────────────────► accepted → converted
              ↘                        ↗
               declined / expired
```

**Rationale**:
- Prevents invalid state hops (e.g. `draft → converted`)
- `transitionQuoteStatus` is the only path to change quote status — field edits use `PUT`
- Converted quotes are locked: cannot be deleted or re-transitioned

---

## Deployment

### Development

```bash
# Start all services
docker-compose up

# Or run separately:
cd backend && npm run dev   # Port 8888
cd frontend && npm run dev  # Port 5173
```

### Production Architecture (Railway)

Deployed as two services in a single Railway project:

```
┌─────────────────────────────────────────────────────────────┐
│                       Railway Project                        │
├─────────────────────────┬───────────────────────────────────┤
│  Frontend Service       │  Backend Service                  │
│  (Nginx via Dockerfile) │  (Node.js via Dockerfile)         │
│  Root: /frontend        │  Root: /backend                   │
│  Serves static SPA      │  REST API                         │
└─────────────────────────┴───────────────────────────────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  MongoDB Atlas    │
                              │  (External)       │
                              └───────────────────┘
```

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Trigger**: Push to main/master, Pull Requests
2. **Backend Job**: `npm ci` → `npm test`
3. **Frontend Job**: `npm ci` → `npm test` (with VITE_API_URL)
4. **Caching**: npm cache for faster builds

### Environment Variables

**Backend** (`.env`):
```
# Server
NODE_ENV=development
PORT=8888

# Database
DATABASE=mongodb://localhost:27017/crm

# Authentication
JWT_SECRET=change_me_use_openssl_rand

# File server (optional)
PUBLIC_SERVER_FILE=http://localhost:8890/

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Rate limiting (optional - defaults shown)
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX=10
GLOBAL_RATE_LIMIT_WINDOW_MS=60000
GLOBAL_RATE_LIMIT_MAX=100
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8888
```

---

*Last updated: March 2026*
