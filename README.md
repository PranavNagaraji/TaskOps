# Service Management System

A comprehensive full-stack Service Management System built with Next.js, Node.js (Express), and Oracle Database. This system provides a structured workflow for managing service requests, customers, and employees across multiple user roles.

## 🎯 Overview

This application enables organizations to efficiently manage service requests with role-based access control. Customers can submit requests, employees can track and update tasks, and administrators can oversee the entire system with reporting capabilities.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 13+ (React + Tailwind CSS) |
| **Backend** | Node.js + Express.js |
| **Database** | Oracle Database |
| **Authentication** | NextAuth.js (Credentials Provider) |
| **API Type** | REST APIs |
| **Architecture** | MVC (Model-View-Controller) |

## ✨ Key Features

- **Multi-Role System**: Admin, Employee, and Customer roles with specific permissions
- **Service Request Management**: Create, assign, track, and update request statuses
- **Employee Dashboard**: View assigned tasks and update progress in real-time
- **Customer Portal**: Submit and monitor service requests with status updates
- **Admin Panel**: Comprehensive user management, service configuration, and reporting
- **Database Integration**: Fully connected with Oracle Database for persistent data storage
- **Secure Authentication**: NextAuth.js-based credential authentication

## 📁 Project Structure

```
service-management-system/
│
├── backend/
│   ├── config/
│   │   └── database.js           # OracleDB connection setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── requestController.js
│   │   ├── employeeController.js
│   │   ├── customerController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── requestModel.js
│   │   ├── employeeModel.js
│   │   ├── customerModel.js
│   │   └── queries.sql           # SQL queries and schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── requests.js
│   │   ├── employees.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js               # Authorization middleware
│   ├── server.js                 # Main backend entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Home page
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth].js
│   │   ├── dashboard/
│   │   │   ├── page.js
│   │   │   ├── admin/
│   │   │   ├── employee/
│   │   │   └── customer/
│   │   └── auth/
│   │       ├── login/
│   │       └── register/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── RequestForm.js
│   │   ├── RequestCard.js
│   │   └── AdminPanel.js
│   ├── lib/
│   │   └── auth.js               # NextAuth configuration
│   ├── styles/
│   │   └── globals.css           # Tailwind CSS setup
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.local
│
├── .gitignore
├── docker-compose.yml            # (Optional) Docker setup
└── README.md
```

## 🗄️ Database Design

### Tables

- **CUSTOMERS**: Stores customer information (ID, name, email, phone, address, created_date)
- **EMPLOYEES**: Contains employee records (ID, name, email, department, role, status)
- **SERVICES**: Lists available services (ID, name, description, category)
- **REQUESTS**: Tracks all service requests (ID, customer_id, service_id, status, created_date, updated_date)
- **ASSIGNMENTS**: Links employees to requests (ID, request_id, employee_id, assigned_date, status)

### Sample Schema

```sql
CREATE TABLE CUSTOMERS (
    ID NUMBER PRIMARY KEY,
    NAME VARCHAR2(100) NOT NULL,
    EMAIL VARCHAR2(100) UNIQUE,
    PHONE VARCHAR2(15),
    ADDRESS VARCHAR2(255),
    CREATED_DATE TIMESTAMP DEFAULT SYSDATE
);

CREATE TABLE EMPLOYEES (
    ID NUMBER PRIMARY KEY,
    NAME VARCHAR2(100) NOT NULL,
    EMAIL VARCHAR2(100) UNIQUE,
    DEPARTMENT VARCHAR2(50),
    ROLE VARCHAR2(50),
    STATUS VARCHAR2(20),
    CREATED_DATE TIMESTAMP DEFAULT SYSDATE
);

CREATE TABLE SERVICES (
    ID NUMBER PRIMARY KEY,
    NAME VARCHAR2(100) NOT NULL,
    DESCRIPTION VARCHAR2(500),
    CATEGORY VARCHAR2(50)
);

CREATE TABLE REQUESTS (
    ID NUMBER PRIMARY KEY,
    CUSTOMER_ID NUMBER NOT NULL,
    SERVICE_ID NUMBER NOT NULL,
    STATUS VARCHAR2(50) DEFAULT 'OPEN',
    DESCRIPTION VARCHAR2(1000),
    CREATED_DATE TIMESTAMP DEFAULT SYSDATE,
    UPDATED_DATE TIMESTAMP DEFAULT SYSDATE,
    FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMERS(ID),
    FOREIGN KEY (SERVICE_ID) REFERENCES SERVICES(ID)
);

CREATE TABLE ASSIGNMENTS (
    ID NUMBER PRIMARY KEY,
    REQUEST_ID NUMBER NOT NULL,
    EMPLOYEE_ID NUMBER NOT NULL,
    STATUS VARCHAR2(50) DEFAULT 'ASSIGNED',
    ASSIGNED_DATE TIMESTAMP DEFAULT SYSDATE,
    FOREIGN KEY (REQUEST_ID) REFERENCES REQUESTS(ID),
    FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEES(ID)
);
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Oracle Database (v19c or higher)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/service-management-system.git
cd service-management-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```ini
PORT=5000
NODE_ENV=development
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=localhost:1521/orcl
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the frontend directory:

```ini
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔐 Authentication

The system uses NextAuth.js for authentication with role-based access control. Login credentials are verified against the database.

### Default Test Credentials

Create test users in your Oracle Database:

```sql
-- Admin User
INSERT INTO EMPLOYEES (ID, NAME, EMAIL, ROLE, STATUS) 
VALUES (1, 'Admin User', 'admin@example.com', 'ADMIN', 'ACTIVE');

-- Employee User
INSERT INTO EMPLOYEES (ID, NAME, EMAIL, ROLE, STATUS) 
VALUES (2, 'John Doe', 'employee@example.com', 'EMPLOYEE', 'ACTIVE');

-- Customer User
INSERT INTO CUSTOMERS (ID, NAME, EMAIL, STATUS) 
VALUES (1, 'Jane Customer', 'customer@example.com', 'ACTIVE');
```

## 📖 Usage

### For Admins

- Access the Admin Panel from the dashboard
- Manage users (create, edit, delete employees and customers)
- Configure available services
- View system reports and analytics
- Monitor all service requests and assignments

### For Employees

- Log in to access the Employee Dashboard
- View assigned service requests
- Update request status (Open → In Progress → Completed)
- Add notes and comments to requests
- Track performance metrics

### For Customers

- Register or log in to create an account
- Submit new service requests
- Track request status in real-time
- View request history
- Provide feedback and ratings

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Requests

- `GET /api/requests` - Get all requests (filtered by role)
- `POST /api/requests` - Create new request
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

### Employees

- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee (admin only)
- `PUT /api/employees/:id` - Update employee (admin only)
- `DELETE /api/employees/:id` - Delete employee (admin only)

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (admin only)

### Assignments

- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment

## 🐳 Docker Setup (Optional)

A `docker-compose.yml` file is provided for easy deployment:

```bash
docker-compose up --build
```

This will start the frontend, backend, and Oracle Database containers.

## 🛡️ Security Considerations

- All API endpoints require authentication
- Sensitive credentials are stored in environment variables
- Passwords should be hashed before storage (bcrypt recommended)
- CORS is configured to allow only trusted origins
- SQL injection prevention through parameterized queries
- Rate limiting recommended for production

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Backend server port | 5000 |
| NODE_ENV | Environment mode | development |
| DB_USER | Oracle username | sys |
| DB_PASSWORD | Oracle password | password123 |
| DB_CONNECT_STRING | Oracle connection string | localhost:1521/orcl |
| JWT_SECRET | JWT signing secret | your_secret_key |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:5000 |
| NEXTAUTH_SECRET | NextAuth secret key | your_secret_key |
| NEXTAUTH_URL | Frontend URL | http://localhost:3000 |

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test
```

### Test Coverage

- Unit tests for controllers
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical workflows

## 📦 Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📋 Code Style

- Use ESLint for JavaScript linting
- Follow React best practices and hooks patterns
- Use Tailwind CSS utility classes for styling
- Write meaningful commit messages
- Add comments for complex logic

## 🐛 Troubleshooting

### Database Connection Issues

If you encounter Oracle connection errors, verify:
- Oracle Database is running
- Connection string is correct in `.env`
- Database credentials are valid
- Firewall allows the connection port

### NextAuth Issues

If authentication fails:
- Ensure `NEXTAUTH_SECRET` is set correctly
- Check NextAuth configuration in `/frontend/app/api/auth/[...nextauth].js`
- Verify callback URLs match your deployment domain

### Port Conflicts

If ports are already in use:
- Change PORT in backend `.env`
- Change port in `npm run dev` with `-- -p <port>`

## 📚 Documentation

For more detailed documentation:
- Backend API docs: `/backend/API_DOCS.md`
- Database schema: `/backend/models/schema.md`
- Frontend components: `/frontend/COMPONENTS.md`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **PRANAV** - Initial work

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact: support@example.com
- Check existing documentation

## 🙏 Acknowledgments

- Next.js documentation and community
- Express.js guides
- Oracle Database documentation
- NextAuth.js resources

---

**Last Updated**: October 2025

**Status**: Active Development

For the latest updates and features, visit the [GitHub repository](https://github.com/PranavNagaraji/TaskOps/edit/main/README.md).
