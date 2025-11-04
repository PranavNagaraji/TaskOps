const oracledb = require('oracledb');
const db = require('../config/db');
const otpModel = require('../models/otpModel');
const Users = require('../models/usersModel');
const mailSender = require('../utils/mailSender');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(req, res) {
  let connection;
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    connection = await oracledb.getConnection(db.config);
    // Block OTP for emails that already have an account
    const existing = await Users.getUserByEmail(connection, email);
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    await otpModel.deleteExpired(connection);
    await otpModel.invalidateExisting(connection, email);
    const otp = generateOtp();
    await otpModel.createOtp(connection, { email, otpCode: otp, ttlMinutes: 5 });

    const html = `<div>\n  <p>Your verification code is:</p>\n  <h2 style="font-size:24px;letter-spacing:4px">${otp}</h2>\n  <p>This code will expire in 5 minutes.</p>\n</div>`;
    await mailSender({ email, subject: 'Your OTP Code', content: html });

    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function verifyOtp(req, res) {
  let connection;
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    connection = await oracledb.getConnection(db.config);
    const result = await otpModel.verifyOtp(connection, { email, otpCode: otp });
    if (!result.valid) return res.status(result.code || 400).json({ message: result.message || 'Invalid OTP' });

    res.json({ message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { sendOtp, verifyOtp };
