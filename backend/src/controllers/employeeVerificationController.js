const oracledb = require('oracledb');
const db = require('../config/db');
const {
  createVerification,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getApprovedEmployees
} = require('../models/employeeVerificationModel');

async function submitVerification(req, res) {
  let connection;
  try {
    const { user_id, document_link } = req.body;
    if (!user_id || !document_link) {
      return res.status(400).json({ error: 'user_id and document_link are required' });
    }

    connection = await oracledb.getConnection(db.config);
    const result = await createVerification(connection, { user_id, document_link });
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.message });
    }

    return res.status(201).json({
      message: 'Verification submitted. Awaiting admin approval.',
      verificationId: result.verificationId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function listPending(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection(db.config);
    const rows = await getPendingVerifications(connection);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function approve(req, res) {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection(db.config);
    const result = await approveVerification(connection, id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.message });
    }

    return res.status(200).json({ message: 'Verification approved', employeeId: result.employeeId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function reject(req, res) {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection(db.config);
    const result = await rejectVerification(connection, id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.message });
    }

    return res.status(200).json({ message: 'Verification rejected' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function listApproved(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection(db.config);
    const rows = await getApprovedEmployees(connection);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  submitVerification,
  listPending,
  approve,
  reject,
  listApproved
};
