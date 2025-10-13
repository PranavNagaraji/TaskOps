# Service Management System

A full-stack Service Management System built using Next.js, Node.js (Express), and Oracle Database.  
This system manages service requests, customers, and employees in a structured workflow.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js (React + Tailwind CSS) |
| Backend | Node.js + Express.js |
| Database | Oracle Database |
| Auth | NextAuth.js (Credentials Provider) |
| API Type | REST APIs |
| Architecture | MVC (Model-View-Controller) |

---

## Features

- User Roles: Admin, Employee, Customer  
- Service Requests: Create, assign, track, and update request status  
- Employee Dashboard: View assigned tasks and update progress  
- Customer Module: Submit and monitor service requests  
- Admin Panel: Manage users, services, and reports  
- Database Integration: Fully connected with OracleDB  

---

## Project Structure

service-management-system/
│
├── backend/
│ ├── config/ # OracleDB connection setup
│ ├── controllers/ # API controllers (business logic)
│ ├── models/ # Oracle SQL queries
│ ├── routes/ # Express routes
│ ├── server.js # Main backend entry
│
├── frontend/
│ ├── app/ # Next.js 13+ app router
│ ├── components/ # Reusable UI components
│ ├── pages/ # Auth and routing pages
│ ├── styles/ # Tailwind setup
│
├── .env.local # Environment variables (NextAuth, DB creds)
├── package.json
└── README.md

yaml
Copy code

---

## Database Design

- CUSTOMERS — Stores customer details  
- EMPLOYEES — Contains employee records  
- SERVICES — Lists available services  
- REQUESTS — Tracks service requests  
- ASSIGNMENTS — Links employees to requests  

*(ER diagram and sample SQL queries can be found in `/backend/models`)*

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/service-management-system.git
cd service-management-system
2. Backend Setup
bash
Copy code
cd backend
npm install
npm start
3. Frontend Setup
bash
Copy code
cd ../frontend
npm install
npm run dev
4. Environment Variables
Create a .env.local file in the frontend and backend folders with:

ini
Copy code
NEXTAUTH_SECRET=<your-secret-key>
DB_USER=<oracle-username>
DB_PASSWORD=<oracle-password>
DB_CONNECT_STRING=<host:port/service-name>
Usage
Admins can manage users, services, and view reports

Employees can view assigned requests and update their status

Customers can create requests and monitor progress
