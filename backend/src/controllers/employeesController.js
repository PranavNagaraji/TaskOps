const oracledb = require('oracledb');
const db = require('../config/db');
const { getAllEmployees, addEmployee, updateEmployeeStatus, deleteEmployee, getActiveEmployees, getInactiveEmployees, updateRole, getEmployeeByUserId } = require('../models/employeesModel');
const mailSender = require('../utils/mailSender');

async function getEmployees(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllEmployees(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getActiveEmployeesController(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getActiveEmployees(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getInactiveEmployeesController(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getInactiveEmployees(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addOneEmployee(req, res) {
    let connection;
    try {
        const employee = req.body;
        connection = await oracledb.getConnection(db.config);
        // Enforce verification approval before insert
        if (!employee.user_id) {
            return res.status(400).json({ error: "user_id is required" });
        }
        const vr = await connection.execute(
            `SELECT STATUS FROM EMPLOYEE_VERIFICATION WHERE USER_ID=:uid ORDER BY VERIFICATION_ID DESC`,
            { uid: employee.user_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const latest = vr.rows[0]?.STATUS;
        if (latest !== 'Approved') {
            return res.status(400).json({ error: "Employee not approved for insertion. Please complete verification." });
        }
        await addEmployee(connection, employee);
        return res.status(201).json({ message: "Data added successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function updateStatus(req, res) {
    let connection;
    try {
        const { userId, status } = req.body;
        connection = await oracledb.getConnection(db.config);
        const result = await updateEmployeeStatus(connection, userId, status);
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        return res.status(200).json({ message: "Data updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteOneEmployee(req, res) {
    let connection;
    try {
        const { employeeId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const result = await deleteEmployee(connection, employeeId);
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        return res.status(200).json({ message: "Data deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function updateEmployeeRole(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { newRole } = req.body;
        if (!newRole) {
            return res.status(400).json({ error: 'newRole is required' });
        }
        connection = await oracledb.getConnection(db.config);
        await updateRole(connection, id, newRole);
        return res.status(200).json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        console.error('Error updating role:', error);
        return res.status(500).json({ success: false, message: 'Error updating role' });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getEmployeeByUserIdController(req, res) {
    let connection;
    try {
        const { userId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const employee = await getEmployeeByUserId(connection, userId);
        
        if (!employee) {
            return res.status(404).json({ exists: false });
        }
        
        return res.status(200).json({ exists: true, employee });
    } catch (err) {
        console.error('Error checking employee by user ID:', err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

async function sendSupportEmail(req, res) {
  try {
    const { subject, message, type, user } = req.body || {};
    const toEmail = process.env.MJ_SENDER_EMAIL;
    if (!toEmail) return res.status(500).json({ error: "TaskOps email not configured" });
    const safeSubject = `[${(type || 'Message')}] ${subject || 'Employee Message'}`;
    const userName = user?.name || '';
    const userEmail = user?.email || '';
    const userPhone = user?.phone || '';
    const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style="margin:0 0 12px; color:#111;">New ${type || 'Message'} from Employee</h2>
    <p style="margin:0 0 12px; line-height:1.6; white-space:pre-wrap;">${(message || '').replace(/</g, '&lt;')}</p>
    <div style="margin-top:16px; font-size:14px; color:#374151;">
      <div><b>Name:</b> ${userName || 'N/A'}</div>
      <div><b>Email:</b> ${userEmail || 'N/A'}</div>
      <div><b>Phone:</b> ${userPhone || 'N/A'}</div>
    </div>
    <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">Sent via TaskOps Employee Portal</p>
  </div>
  </div>`;
    await mailSender({ email: toEmail, subject: safeSubject, content: html });
    return res.status(200).json({ message: "Email sent" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { 
    getEmployees, 
    addOneEmployee, 
    updateStatus, 
    deleteOneEmployee, 
    getActiveEmployeesController, 
    getInactiveEmployeesController, 
    updateEmployeeRole,
    getEmployeeByUserIdController,
    sendSupportEmail 
};