const oracledb = require("oracledb");
const db = require("../config/db.js");
const Customers = require("../models/customersModel");
const mailSender = require("../utils/mailSender");

//GET /api/customers
async function getCustomers(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await Customers.getAllCustomers(connection);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

//POST /api/customers
async function addCustomer(req, res) {
    let connection;
    const { name, phone, email, address, user_id } = req.body;
    try {
        connection = await oracledb.getConnection(db.config);
        await Customers.addCustomer(connection, { name, phone, email, address, user_id });
        res.status(201).json({ message: "Customer added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteCustomer(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const { customer_id } = req.params;
        await Customers.deleteCustomer(connection, customer_id);
        res.status(200).json({ message: "Customer deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getCustomerByUser(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const { user_id } = req.params;
        const data = await Customers.getCustomerByUser(connection, user_id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addRequest(req, res) {
    let connection;
    try {
        const { serviceId, userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId is required" });
        if (!serviceId) return res.status(400).json({ error: "serviceId is required" });

        connection = await oracledb.getConnection(dbConfig);
        const requestId = await RequestModel.createRequest(connection, userId, serviceId);
        res.status(201).json({ message: "Request created", requestId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function sendSupportEmail(req, res) {
    try {
        const { subject, message, type, user } = req.body || {};
        const toEmail = process.env.MJ_SENDER_EMAIL;
        if (!toEmail) return res.status(500).json({ error: "TaskOps email not configured" });
        const safeSubject = `[${(type || 'Message')}] ${subject || 'Customer Message'}`;
        const userName = user?.name || '';
        const userEmail = user?.email || '';
        const userPhone = user?.phone || '';
        const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style="margin:0 0 12px; color:#111;">New ${type || 'Message'} from Customer</h2>
    <p style="margin:0 0 12px; line-height:1.6; white-space:pre-wrap;">${(message || '').replace(/</g, '&lt;')}</p>
    <div style="margin-top:16px; font-size:14px; color:#374151;">
      <div><b>Name:</b> ${userName || 'N/A'}</div>
      <div><b>Email:</b> ${userEmail || 'N/A'}</div>
      <div><b>Phone:</b> ${userPhone || 'N/A'}</div>
    </div>
    <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">Sent via TaskOps Customer Portal</p>
  </div>
  </div>`;
        await mailSender({ email: toEmail, subject: safeSubject, content: html });
        return res.status(200).json({ message: "Email sent" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getCustomers, addCustomer, deleteCustomer, getCustomerByUser, addRequest, sendSupportEmail };