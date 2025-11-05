const oracledb = require('oracledb');
const db = require("../config/db");
const { getAllRequestsAndAssignments, getAllAssignments, addAssignment, markAssignmentAsCompleted, deleteAssignment, getAssignmentsByEmployee } = require("../models/assignmentsModel")
const mailSender = require('../utils/mailSender');

// In-memory OTP store for assignment completion
// Map<assignmentId, { code: string, expiresAt: number }>
const completionOtps = new Map();

async function getAssignments(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllAssignments(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getAllRequestsAndAssignmentsController(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllRequestsAndAssignments(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addOneAssignment(req, res) {
    const { requestId, userId } = req.body;
    const connection = await oracledb.getConnection(db.config)
    try {
        const result = await connection.execute(
            `SELECT EMPLOYEE_ID FROM EMPLOYEES WHERE USER_ID = :userId`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const employeeId = result.rows[0]?.EMPLOYEE_ID;
        if (!employeeId) {
            return res.status(404).json({ error: "Employee not found for this user" });
        }
        await addAssignment(connection, requestId, employeeId);
        res.status(201).json({ message: "Assignment added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

async function markCompleted(req, res) {
    let connection;
    try {
        const { assignmentId } = req.body;
        connection = await oracledb.getConnection(db.config);
        const data = await markAssignmentAsCompleted(connection, assignmentId);
        if (data.success == true)
            return res.status(200).json({ message: "Data modified successfully" });
        return res.status(404).json({ error: `No such entry with ${assignmentId} found` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteOneAssignment(req, res) {
    let connection;
    try {
        const { assignmentId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const data = await deleteAssignment(connection, assignmentId);
        if (data.success == true)
            return res.status(200).json({ message: "Data deleted successfully" });
        return res.status(404).json({ error: `No such entry with ${assignmentId} found` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getAssignmentsByEmployeeId(req, res) {
    let connection;
    try {
        const { userId } = req.params;
        connection = await oracledb.getConnection(db.config);

        const data = await getAssignmentsByEmployee(connection, userId);
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching employee assignments:", err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function sendCompletionOtp(req, res) {
    let connection;
    try {
        const { assignmentId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const q = await connection.execute(
            `SELECT c.EMAIL AS CUSTOMER_EMAIL, c.NAME AS CUSTOMER_NAME, s.NAME AS SERVICE_NAME
               FROM ASSIGNMENTS a
               JOIN REQUESTS r ON a.REQUEST_ID = r.REQUEST_ID
               JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
               JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
              WHERE a.ASSIGNMENT_ID = :assignmentId`,
            { assignmentId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const row = q.rows?.[0];
        if (!row?.CUSTOMER_EMAIL) {
            return res.status(404).json({ error: 'Customer email not found for this assignment' });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const ttlMinutes = 10;
        const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
        completionOtps.set(String(assignmentId), { code, expiresAt });

        const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style=\"margin:0 0 12px; color:#111;\">Task Completion Verification</h2>
    <p style=\"margin:0 0 12px; line-height:1.6;\">Dear ${row.CUSTOMER_NAME || 'Customer'},</p>
    <p style=\"margin:0 0 12px; line-height:1.6;\">
      Your task for <b>${row.SERVICE_NAME || 'the requested service'}</b> is being marked as <b>Completed</b> by the assigned employee.
      To confirm completion, please provide the following One-Time Password (OTP) to the employee:
    </p>
    <h2 style=\"font-size:24px;letter-spacing:4px;margin:8px 0;\">${code}</h2>
    <p style=\"margin:0 0 12px; line-height:1.6;\">This OTP will expire in ${ttlMinutes} minutes.</p>
    <p style=\"margin:16px 0 0;\">Thank you,<br/>TaskOps Team</p>
  </div>
 </div>`;
        await mailSender({ email: row.CUSTOMER_EMAIL, subject: 'TaskOps: Completion OTP Verification', content: html });
        return res.status(200).json({ message: 'OTP sent to customer' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function verifyCompletionOtp(req, res) {
    try {
        const { assignmentId } = req.params;
        const { otp } = req.body || {};
        const rec = completionOtps.get(String(assignmentId));
        if (!rec) return res.status(400).json({ valid: false, message: 'OTP not found. Please request a new one.' });
        if (Date.now() > rec.expiresAt) {
            completionOtps.delete(String(assignmentId));
            return res.status(400).json({ valid: false, message: 'OTP expired. Please request a new one.' });
        }
        if (String(otp).trim() !== rec.code) {
            return res.status(400).json({ valid: false, message: 'Invalid OTP. Please try again.' });
        }
        completionOtps.delete(String(assignmentId));
        return res.status(200).json({ valid: true, message: 'OTP verified' });
    } catch (err) {
        return res.status(500).json({ valid: false, message: err.message });
    }
}

module.exports = { getAssignments, getAllRequestsAndAssignmentsController, addOneAssignment, markCompleted, deleteOneAssignment, getAssignmentsByEmployeeId, sendCompletionOtp, verifyCompletionOtp };