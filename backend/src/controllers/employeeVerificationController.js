const oracledb = require('oracledb');
const db = require('../config/db');
const mailSender = require('../utils/mailSender');
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
    const role = req.body.employeeRole || req.body.role || null;
    const result = await createVerification(connection, { user_id, document_link, role });
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

    // Fetch user email to notify rejection
    const q = await connection.execute(
      `SELECT U.EMAIL, U.NAME
         FROM EMPLOYEE_VERIFICATION EV
         JOIN USERS U ON U.ID = EV.USER_ID
        WHERE EV.VERIFICATION_ID = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = q.rows?.[0];
    if (user?.EMAIL) {
      const html = `<div>
        <p>Dear ${user.NAME || 'Applicant'},</p>
        <p>We’re sorry to inform you that your employee verification request has been rejected by the admin.</p>
        <p>If you believe this was a mistake or if you have additional documents to support your application, please resubmit your verification with the correct details.</p>
        <p>Thank you,<br/>TaskOps Team</p>
      </div>`;
      try {
        await mailSender({
          email: user.EMAIL,
          subject: 'Employee Verification - Application Rejected',
          content: html,
        });
      } catch (_) {
        // Do not fail the API if email sending fails
      }
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
