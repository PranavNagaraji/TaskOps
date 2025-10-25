const express = require('express');
const cors = require('cors');
const customerRouter = require("./routes/customersRoute");
const serviceRouter = require("./routes/servicesRoute");
const requestRouter = require("./routes/requestsRoute");
const employeeRouter = require("./routes/employeesRoute");
const assignmentRouter = require("./routes/assignmentsRoute");
const userRouter = require("./routes/usersRoute");
const authRouter = require("./routes/authRoutes");
const employeeVerificationRouter = require("./routes/employeeVerificationRoute");

require('dotenv').config();

const { initDB } = require('./config/db');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/customers", customerRouter);
app.use("/api/services", serviceRouter);
app.use("/api/requests", requestRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/employee-verification", employeeVerificationRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await initDB();
});