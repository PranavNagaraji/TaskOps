const oracledb = require('oracledb');

async function invalidateExisting(connection, email) {
  await connection.execute(
    `DELETE FROM OTP_VERIFICATION WHERE EMAIL = :email AND VERIFIED = 'N'`,
    { email },
    { autoCommit: true }
  );
}

async function deleteExpired(connection) {
  await connection.execute(
    `DELETE FROM OTP_VERIFICATION WHERE VERIFIED = 'N' AND EXPIRES_AT < SYSDATE`,
    [],
    { autoCommit: true }
  );
}

async function createOtp(connection, { email, userId = null, otpCode, ttlMinutes = 5 }) {
  const binds = {
    email,
    otpCode,
    ttl: ttlMinutes,
    id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
  };

  let sql;
  if (userId !== null && userId !== undefined) {
    sql = `INSERT INTO OTP_VERIFICATION (USER_ID, EMAIL, OTP_CODE, EXPIRES_AT, VERIFIED)
           VALUES (:userId, :email, :otpCode, SYSDATE + NUMTODSINTERVAL(:ttl, 'MINUTE'), 'N')
           RETURNING OTP_ID INTO :id`;
    binds.userId = userId;
  } else {
    sql = `INSERT INTO OTP_VERIFICATION (EMAIL, OTP_CODE, EXPIRES_AT, VERIFIED)
           VALUES (:email, :otpCode, SYSDATE + NUMTODSINTERVAL(:ttl, 'MINUTE'), 'N')
           RETURNING OTP_ID INTO :id`;
  }

  const result = await connection.execute(sql, binds, { autoCommit: true });
  return result.outBinds.id[0];
}

async function verifyOtp(connection, { email, otpCode }) {
  const res = await connection.execute(
    `SELECT OTP_ID, EXPIRES_AT, VERIFIED
     FROM OTP_VERIFICATION
     WHERE EMAIL = :email AND OTP_CODE = :otp
     ORDER BY OTP_ID DESC FETCH FIRST 1 ROWS ONLY`,
    { email, otp: otpCode },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const row = res.rows[0];
  if (!row) return { valid: false, code: 404, message: 'Invalid OTP' };
  if (row.VERIFIED === 'Y') return { valid: false, code: 400, message: 'OTP already used' };

  const expRes = await connection.execute(
    `SELECT CASE WHEN :expires_at >= SYSDATE THEN 1 ELSE 0 END AS VALID FROM DUAL`,
    { expires_at: row.EXPIRES_AT },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const notExpired = expRes.rows[0]?.VALID === 1;
  if (!notExpired) return { valid: false, code: 400, message: 'OTP expired' };

  await connection.execute(
    `UPDATE OTP_VERIFICATION SET VERIFIED = 'Y' WHERE OTP_ID = :id`,
    { id: row.OTP_ID },
    { autoCommit: true }
  );
  return { valid: true, otpId: row.OTP_ID };
}

async function isEmailVerified(connection, email) {
  const res = await connection.execute(
    `SELECT 1 AS OK
     FROM OTP_VERIFICATION
     WHERE EMAIL = :email AND VERIFIED = 'Y' AND EXPIRES_AT >= SYSDATE
     ORDER BY OTP_ID DESC FETCH FIRST 1 ROWS ONLY`,
    { email },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return res.rows.length > 0;
}

module.exports = {
  invalidateExisting,
  deleteExpired,
  createOtp,
  verifyOtp,
  isEmailVerified,
};
