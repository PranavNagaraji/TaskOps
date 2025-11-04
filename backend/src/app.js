const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const oracledb = require('oracledb');
const customerRouter = require("./routes/customersRoute");
const serviceRouter = require("./routes/servicesRoute");
const requestRouter = require("./routes/requestsRoute");
const employeeRouter = require("./routes/employeesRoute");
const assignmentRouter = require("./routes/assignmentsRoute");
const userRouter = require("./routes/usersRoute");
const authRouter = require("./routes/authRoutes");
const employeeVerificationRouter = require("./routes/employeeVerificationRoute");
const otpRouter = require("./routes/otpRoutes");

require('dotenv').config();

const { initDB } = require('./config/db');
const db = require('./config/db');
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
app.use("/api/otp", otpRouter);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// In-memory chat store: Map<requestId, Message[]>
// Message: { senderId, senderType, name, text, ts }

async function isParticipant(requestId, userId, userType) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        if (userType === 'employee') {
            const res = await connection.execute(
                `SELECT 1
                 FROM ASSIGNMENTS a
                 JOIN EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
                 WHERE a.REQUEST_ID = :requestId AND e.USER_ID = :userId`,
                { requestId, userId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return res.rows.length > 0;
        } else if (userType === 'customer') {
            const res = await connection.execute(
                `SELECT 1
                 FROM REQUESTS r
                 JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
                 WHERE r.REQUEST_ID = :requestId AND c.USER_ID = :userId`,
                { requestId, userId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return res.rows.length > 0;
        }
        return false;
    } catch (_) {
        return false;
    } finally {
        if (connection) await connection.close();
    }
}
const chatStore = new Map();

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

async function isRequestCompleted(requestId) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const res = await connection.execute(
            `SELECT STATUS FROM REQUESTS WHERE REQUEST_ID = :requestId`,
            { requestId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const status = res.rows?.[0]?.STATUS;
        return status === 'Completed';
    } catch (_) {
        return false;
    } finally {
        if (connection) await connection.close();
    }
}

io.on('connection', (socket) => {
    socket.on('join', async ({ requestId, userId, userType, name }) => {
        if (!requestId || !userId || !userType) return;
        if (await isRequestCompleted(requestId)) {
            socket.emit('chatClosed', { reason: 'completed' });
            return;
        }
        if (!(await isParticipant(requestId, userId, userType))) {
            socket.emit('chatClosed', { reason: 'unauthorized' });
            return;
        }
        socket.join(String(requestId));
        const history = chatStore.get(String(requestId)) || [];
        socket.emit('history', history);
    });

    socket.on('message', async ({ requestId, text, userId, userType, name, ts }) => {
        const msg = (text || '').trim();
        if (!requestId || !userId || !userType || !msg) return;
        if (await isRequestCompleted(requestId)) {
            io.to(String(requestId)).emit('chatClosed', { reason: 'completed' });
            return;
        }
        if (!(await isParticipant(requestId, userId, userType))) {
            socket.emit('chatClosed', { reason: 'unauthorized' });
            return;
        }
        const entry = {
            senderId: userId,
            senderType: userType,
            name: name || '',
            text: msg,
            ts: ts || Date.now()
        };
        const key = String(requestId);
        const list = chatStore.get(key) || [];
        list.push(entry);
        // limit history to last 200 messages per request to avoid unbounded growth
        if (list.length > 200) list.splice(0, list.length - 200);
        chatStore.set(key, list);
        io.to(key).emit('message', entry);
    });
});

server.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await initDB();
});