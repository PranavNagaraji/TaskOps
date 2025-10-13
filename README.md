Service Management System
A full-stack Service Management System built with Next.js, Node.js (Express), and Oracle Database.
This platform facilitates structured management of service requests, customers, and employees.

Tech Stack
Layer	Technology
Frontend	Next.js (React + Tailwind CSS)
Backend	Node.js + Express.js
Database	Oracle Database
Auth	NextAuth.js (Credentials)
API Type	REST APIs
Arch	MVC (Model-View-Controller)
Features
User roles: Admin, Employee, Customer

Service request workflow: create, assign, track, update status

Employee dashboard: view and update assigned tasks

Customer module: submit and monitor requests

Admin panel: manage users, services, and reports

Fully integrated with OracleDB

Project Structure
bash
service-management-system/
│
├── backend/
│   ├── config/         # OracleDB connection setup
│   ├── controllers/    # API controllers (business logic)
│   ├── models/         # Oracle SQL queries
│   ├── routes/         # Express routes
│   └── server.js       # Backend entry point
│
├── frontend/
│   ├── app/            # Next.js 13+ app router
│   ├── components/     # Shared React components
│   ├── pages/          # Auth and other pages
│   ├── styles/         # Tailwind CSS setup
│
├── .env.local          # Environment variables
├── package.json        # Project scripts & dependencies
└── README.md           # Documentation
Database Design
CUSTOMERS — Customer details

EMPLOYEES — Employee records

SERVICES — Service catalog

REQUESTS — Service request status and tracking

ASSIGNMENTS — Employees ↔ requests relationship

Sample ER diagram and SQL queries in /backend/models.

Installation & Setup
1. Clone the Repository
bash
git clone https://github.com/<your-username>/service-management-system.git
cd service-management-system
2. Backend Setup
bash
cd backend
npm install
npm start
3. Frontend Setup
bash
cd ../frontend
npm install
npm run dev
4. Environment Variables
Create a .env.local file in both frontend and backend folders:

text
NEXTAUTH_SECRET=<your-secret-key>
DB_USER=<oracle-username>
DB_PASSWORD=<oracle-password>
DB_CONNECT_STRING=<host:port/service-name>
Usage
Admins: Manage users, services, assignments, reports

Employees: View assigned requests, update progress

Customers: Create requests, monitor status
