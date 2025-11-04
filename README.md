# TaskOps – Service Management System

A full‑stack service management platform built with Next.js (App Router), Express.js, Socket.IO, and Oracle Database. It supports multi‑role workflows (customer, employee, admin), request lifecycle management, employee assignment, real‑time chat per request, and employee verification.

## Highlights

- **Roles**: customer, employee, admin
- **Core entities**: Users, Customers, Employees, Services, Requests, Assignments, Employee Verification
- **Auth**: NextAuth Credentials -> hits backend `POST /api/auth/login`
- **DB**: Oracle with sequences + triggers for IDs
- **Realtime**: Socket.IO chat on request rooms with authorization guards

# Architecture

- **Frontend (Next.js 13+)**
  - Path-based role dashboards under `src/app/{role}/...`
  - NextAuth credentials provider at `src/app/api/auth/[...nextauth]/route.js`
  - `ChatModal.jsx` connects to backend via Socket.IO using `NEXT_PUBLIC_BACKEND_URL`
- **Backend (Express)**
  - Routers: customers, services, requests, employees, assignments, users, auth, employee-verification
  - Controllers + Models (Oracle SQL)
  - Socket.IO server mounted on the same HTTP server
- **Database (Oracle)**
  - Tables defined in `sms_db.sql` and `employee_verification.sql`
  - Sequences + triggers per table to generate IDs

# Project Structure (actual)

```
Service_Management/
├─ backend/
│  └─ src/
│     ├─ app.js                      # Express app + Socket.IO chat
│     ├─ config/db.js                # Oracle config + test connection
│     ├─ routes/                     # REST routes
│     ├─ controllers/                # Request handlers
│     └─ models/                     # SQL access
├─ frontend/
│  └─ src/app/
│     ├─ api/auth/[...nextauth]/route.js
│     ├─ components/{AuthProvider,ProtectedRoutes,ChatModal}.jsx
│     ├─ {about,page}.js, layout.js, globals.css
│     ├─ admin/{dashboard,services,employees,requests,customers,...}
│     ├─ customer/{dashboard,myRequests}
│     └─ employee/{dashboard,requests,assignments,layout.js}
├─ sms_db.sql                         # Core schema
├─ employee_verification.sql          # Verification schema
└─ README.generated.md
```

# Data Model and ER Diagram

Entities and relations inferred from SQL and queries:

- **USERS**(ID, NAME, EMAIL, PASSWORD_HASH, ROLE, PHONE, CREATED_AT)
- **CUSTOMERS**(CUSTOMER_ID, USER_ID → USERS.ID, NAME, PHONE, EMAIL, ADDRESS)
- **EMPLOYEES**(EMPLOYEE_ID, USER_ID → USERS.ID, NAME, PHONE, EMAIL, ROLE, STATUS, HIRE_DATE)
- **SERVICES**(SERVICE_ID, NAME, DESCRIPTION, COST, STATUS, DURATION)
- **REQUESTS**(REQUEST_ID, CUSTOMER_ID → CUSTOMERS.CUSTOMER_ID, SERVICE_ID → SERVICES.SERVICE_ID, STATUS, CREATED_AT, CLOSED_AT)
- **ASSIGNMENTS**(ASSIGNMENT_ID, REQUEST_ID → REQUESTS.REQUEST_ID, EMPLOYEE_ID → EMPLOYEES.EMPLOYEE_ID, ASSIGNED_AT, COMPLETED_AT)
- **EMPLOYEE_VERIFICATION**(VERIFICATION_ID, USER_ID → USERS.ID, EMPLOYEE_ID nullable, STATUS, DOCUMENT_LINK, CREATED_AT, UPDATED_AT)

```mermaid
erDiagram
  USERS ||--o{ CUSTOMERS : has
  USERS ||--o{ EMPLOYEES : has
  CUSTOMERS ||--o{ REQUESTS : creates
  SERVICES ||--o{ REQUESTS : requested_for
  REQUESTS ||--o{ ASSIGNMENTS : assigned_to
  EMPLOYEES ||--o{ ASSIGNMENTS : works_on
  USERS ||--o{ EMPLOYEE_VERIFICATION : submits

  USERS {
    number ID PK
    string NAME
    string EMAIL
    string PASSWORD_HASH
    string ROLE
    string PHONE
    timestamp CREATED_AT
  }
  CUSTOMERS {
    number CUSTOMER_ID PK
    number USER_ID FK
    string NAME
    number PHONE
    string EMAIL
    string ADDRESS
  }
  EMPLOYEES {
    number EMPLOYEE_ID PK
    number USER_ID FK
    string NAME
    number PHONE
    string EMAIL
    string ROLE
    string STATUS
    date HIRE_DATE
  }
  SERVICES {
    number SERVICE_ID PK
    string NAME
    string DESCRIPTION
    number COST
    string STATUS
    number DURATION
  }
  REQUESTS {
    number REQUEST_ID PK
    number CUSTOMER_ID FK
    number SERVICE_ID FK
    string STATUS
    timestamp CREATED_AT
    timestamp CLOSED_AT
  }
  ASSIGNMENTS {
    number ASSIGNMENT_ID PK
    number REQUEST_ID FK
    number EMPLOYEE_ID FK
    timestamp ASSIGNED_AT
    timestamp COMPLETED_AT
  }
  EMPLOYEE_VERIFICATION {
    number VERIFICATION_ID PK
    number USER_ID FK
    number EMPLOYEE_ID
    string STATUS
    string DOCUMENT_LINK
    date CREATED_AT
    date UPDATED_AT
  }
```

# Request Lifecycle and Flows

- **Customer flow**
  - Customer (linked to a `USERS` row) submits a service request against a `SERVICE`.
  - `POST /api/requests` with `{ customerId, serviceId }` creates a `REQUESTS` row (status: Pending).
  - Customer can view their requests from frontend pages under `customer/`.

- **Admin flow**
  - Views all requests and unassigned items (`GET /api/requests`, `/api/assignments/requests/all`).
  - Assigns an employee to a request via `POST /api/assignments` with `{ requestId, userId }`.
  - Managing catalogs via Services and Users APIs.

- **Employee flow**
  - Employee (must be approved via Employee Verification) appears in `EMPLOYEES`.
  - Sees assignments with `GET /api/assignments/employee/:userId`.
  - Marks assignment complete via `PATCH /api/assignments` -> sets `ASSIGNMENTS.COMPLETED_AT`, and `REQUESTS` is set to `Completed` + `CLOSED_AT` timestamp.

- **Verification flow**
  - User submits verification: `POST /api/employee-verification` with `{ user_id, document_link, role? }`.
  - Admin lists pendings `GET /api/employee-verification/pending`, then approves `PATCH /:id/approve` or rejects `/:id/reject`.
  - `employeesController.addOneEmployee` enforces latest verification status be `Approved` before inserting into `EMPLOYEES`.

- **Status management**
  - Requests initially `Pending`.
  - On assignment, set to `In Progress`.
  - On completion, set to `Completed` (and `CLOSED_AT` set).
  - Housekeeping endpoint: `PUT /api/requests/incomplete` sets unassigned `In Progress` back to `Pending`.

# Realtime Chat (per Request)

- Socket.IO server in `backend/src/app.js` with in‑memory store per `requestId`.
- Join room: client emits `join` with `{ requestId, userId, userType, name }`.
  - Server validates participant: employees (via `ASSIGNMENTS`+`EMPLOYEES.USER_ID`), customers (via `REQUESTS`+`CUSTOMERS.USER_ID`).
  - If request is completed, emits `chatClosed`.
- Send message: client emits `message` with `{ requestId, text, userId, userType, name, ts }`.
  - Server validates and broadcasts to room; retains last 200 messages in memory.
- Frontend: `ChatModal.jsx` connects using `NEXT_PUBLIC_BACKEND_URL` and renders history/messages.

# REST API (actual routes)

Base URL: `http://localhost:5000/api`

- **Auth**
  - `POST /auth/login` → `usersController.loginUser`
- **Users**
  - `GET /users` | `GET /users/:id` | `POST /users` | `DELETE /users/:id`
- **Customers**
  - `GET /customers`
  - `POST /customers`
  - `DELETE /customers/:customer_id`
  - `GET /customers/:user_id` (fetch by linked user)
- **Services**
  - `GET /services` | `GET /services/:id`
  - `POST /services` | `PUT /services/:id` | `DELETE /services/:id`
- **Requests**
  - `GET /requests` (with details)
  - `GET /requests/all` (raw list)
  - `POST /requests` (create)
  - `PUT /requests` (update status)
  - `PUT /requests/incomplete` (housekeeping)
  - `DELETE /requests/:requestId`
- **Assignments**
  - `GET /assignments`
  - `GET /assignments/requests/all` (assigned + unassigned)
  - `GET /assignments/employee/:userId`
  - `POST /assignments` (assign by userId → resolves to EMPLOYEE_ID)
  - `PATCH /assignments` (mark completed)
  - `DELETE /assignments/:assignmentId`
- **Employee Verification**
  - `POST /employee-verification`
  - `GET /employee-verification/pending`
  - `PATCH /employee-verification/:id/approve`
  - `PATCH /employee-verification/:id/reject`
  - `GET /employee-verification/approved`

# Environment Variables

- Backend `.env`
  - `PORT=5000`
  - `DB_USER=...`
  - `DB_PASSWORD=...`
  - `DB_CONNECT=host:port/service` (used as `connectString`)
- Frontend `.env.local`
  - `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`
  - `NEXTAUTH_SECRET=...`
  - `NEXTAUTH_URL=http://localhost:3000`

# Setup

1) Backend
- `cd backend && npm install`
- Create `.env` with DB creds above
- `npm start` (server on 5000)
- On start, `initDB()` validates Oracle connectivity

2) Frontend
- `cd frontend && npm install`
- Create `.env.local` with vars above
- `npm run dev` (web on 3000)

3) Database
- Run `sms_db.sql` then `employee_verification.sql`
- This creates tables, sequences, and triggers for auto IDs

# Notes and Constraints

- Passwords stored as `PASSWORD_HASH` (bcrypt in `usersController`)
- Employee insertion is blocked until verification status is `Approved`
- Chat history is in‑memory per process; not persisted
- Oracle queries are parameterized and use `autoCommit` for write ops

# License
@pranavsresh1947@gmail.com