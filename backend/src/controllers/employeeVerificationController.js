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

    // Fetch user email BEFORE approving (in case approval modifies records)
    const q = await connection.execute(
      `SELECT U.EMAIL, U.NAME
         FROM EMPLOYEE_VERIFICATION EV
         JOIN USERS U ON U.ID = EV.USER_ID
        WHERE EV.VERIFICATION_ID = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = q.rows?.[0];

    const result = await approveVerification(connection, id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.message });
    }

    // Send approval email
    if (user?.EMAIL) {
      const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style="margin:0 0 12px; color:#111;">
      Congratulations, ${user.NAME || 'Applicant'}! 🎉
    </h2>

    <p style="margin:0 0 12px; line-height:1.6;">
      Your employee verification request has been <b>approved</b> by the admin.
    </p>

    <p style="margin:0 0 12px; line-height:1.6;">
      You can now access your employee dashboard and start managing your tasks.
    </p>

    <!-- Button (email-safe) -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
      <tr>
        <td align="center" bgcolor="#111827" style="border-radius:8px;">
          <a 
            href="http://localhost:3000/employee/dashboard"
            target="_blank"
            style="
              display:inline-block;
              padding:10px 16px;
              color:#ffffff;
              background-color:#111827;
              text-decoration:none;
              border-radius:8px;
              font-weight:500;
            "
          >
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">
      If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="http://localhost:3000/employee/dashboard" style="color:#111827; text-decoration:none;">
        http://localhost:3000/employee/dashboard
      </a>
    </p>

    <p style="margin:16px 0 0;">
      Thank you,<br />
      TaskOps Team
    </p>
  </div>
</div>
`;

      try {
        console.log('[APPROVAL EMAIL] Sending to:', user.EMAIL);
        await mailSender({
          email: user.EMAIL,
          subject: 'Your TaskOps Employee Account Has Been Approved',
          content: html,
        });
        console.log('[APPROVAL EMAIL] Sent successfully to:', user.EMAIL);
      } catch (emailErr) {
        console.error('[APPROVAL EMAIL] Failed to send:', emailErr.message || emailErr);
        // Do not fail the API if email sending fails
      }
    } else {
      console.warn('[APPROVAL EMAIL] No user email found for verification ID:', id);
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

    // Fetch user email BEFORE rejecting (in case rejection modifies records)
    const q = await connection.execute(
      `SELECT U.EMAIL, U.NAME
         FROM EMPLOYEE_VERIFICATION EV
         JOIN USERS U ON U.ID = EV.USER_ID
        WHERE EV.VERIFICATION_ID = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = q.rows?.[0];

    const result = await rejectVerification(connection, id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.message });
    }

    // Send rejection email
    if (user?.EMAIL) {
      const html = `<div>
        <p>Dear ${user.NAME || 'Applicant'},</p>
        <p>We're sorry to inform you that your employee verification request has been rejected by the admin.</p>
        <p>If you believe this was a mistake or if you have additional documents to support your application, please resubmit your verification with the correct details.</p>
        <p>Thank you,<br/>TaskOps Team</p>
      </div>`;
      try {
        console.log('[REJECTION EMAIL] Sending to:', user.EMAIL);
        await mailSender({
          email: user.EMAIL,
          subject: 'Your TaskOps Employee Verification Request Has Been Rejected',
          content: html,
        });
        console.log('[REJECTION EMAIL] Sent successfully to:', user.EMAIL);
      } catch (emailErr) {
        console.error('[REJECTION EMAIL] Failed to send:', emailErr.message || emailErr);
        // Do not fail the API if email sending fails
      }
    } else {
      console.warn('[REJECTION EMAIL] No user email found for verification ID:', id);
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
