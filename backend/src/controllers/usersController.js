const oracledb = require("oracledb");
const db = require("../config/db.js");
const Users = require("../models/usersModel");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const mailSender = require("../utils/mailSender");

async function addUser(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection(db.config);
    const { name, email, password, role, phone } = req.body;

    // Require verified OTP for the provided email before creating the user
    const isVerified = await otpModel.isEmailVerified(connection, email);
    if (!isVerified) {
      return res.status(400).json({ message: "Email not verified. Please verify OTP before signing up." });
    }

    // Prevent duplicate accounts for the same email
    const existing = await Users.getUserByEmail(connection, email);
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUserId = await Users.addUser(connection, { name, email, password_hash, role, phone });
    res.status(201).json({
      message: "User added successfully",
      userId: newUserId // The newly created ID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getAllUsers(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection(db.config);
    const users = await Users.getAll(connection);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserById(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const user = await Users.getById(connection, req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function deleteUser(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const userId = req.params.id;
        // Fetch user details BEFORE deletion for email notification
        const q = await connection.execute(
            `SELECT ID, NAME, EMAIL, ROLE FROM USERS WHERE ID = :id`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const user = q.rows?.[0];

        await Users.deleteUser(connection, userId);

        // Fire-and-forget style email (do not fail API if email send fails)
        if (user?.EMAIL) {
            const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style="margin:0 0 12px; color:#111;">Your TaskOps Account Has Been Removed</h2>
    <p style="margin:0 0 12px; line-height:1.6;">Dear ${user.NAME || 'User'},</p>
    <p style="margin:0 0 12px; line-height:1.6;">
      This is to inform you that your TaskOps account${user.ROLE ? ` (role: <b>${user.ROLE}</b>)` : ''} has been removed by the administrator.
    </p>
    <p style="margin:0 0 12px; line-height:1.6;">
      If you believe this was a mistake or if you need further assistance, please reply to this email.
    </p>
    <p style="margin:16px 0 0;">Thank you,<br/>TaskOps Team</p>
  </div>
 </div>`;
            mailSender({
                email: user.EMAIL,
                subject: 'Your TaskOps Account Has Been Removed',
                content: html,
            }).catch((e) => {
                try { console.error('[DELETE USER EMAIL] Failed:', e?.message || e); } catch (_) {}
            });
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function loginUser(req, res) {
    let connection;
    const { email, password } = req.body;
    try {
        connection = await oracledb.getConnection(db.config);
        const user = await Users.getUserByEmail(connection, email);
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        const { ID, NAME, EMAIL, ROLE } = user;
        res.json({ id: ID, name: NAME, email: EMAIL, role: ROLE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

module.exports = { addUser, getAllUsers, getUserById, deleteUser, loginUser };