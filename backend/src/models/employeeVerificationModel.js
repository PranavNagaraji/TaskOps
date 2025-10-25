// models/employeeVerification.js
const oracledb = require('oracledb');

async function userExists(connection, userId) {
    const result = await connection.execute(
        `SELECT ID, NAME, EMAIL, ROLE, PHONE FROM USERS WHERE ID = :userId`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows[0];
}

async function hasActiveVerification(connection, userId) {
    const result = await connection.execute(
        `SELECT VERIFICATION_ID FROM EMPLOYEE_VERIFICATION 
         WHERE USER_ID = :userId AND STATUS IN ('Pending','Approved')`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.length > 0;
}

async function getEmployeeByUserId(connection, userId) {
    const result = await connection.execute(
        `SELECT EMPLOYEE_ID FROM EMPLOYEES WHERE USER_ID = :userId`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows[0]?.EMPLOYEE_ID;
}

async function insertEmployeeFromUser(connection, user) {
    const result = await connection.execute(
        `INSERT INTO EMPLOYEES (NAME, PHONE, EMAIL, ROLE, HIRE_DATE, STATUS, USER_ID)
         VALUES (:name, :phone, :email, :role, SYSDATE, :status, :user_id)
         RETURNING EMPLOYEE_ID INTO :new_emp_id`,
        {
            name: user.NAME,
            phone: user.PHONE,
            email: user.EMAIL,
            role: user.ROLE || 'Employee',
            status: 'Active',
            user_id: user.ID,
            new_emp_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: true }
    );
    return result.outBinds.new_emp_id[0];
}

async function createVerification(connection, { user_id, document_link }) {
    const user = await userExists(connection, user_id);
    if (!user) return { success: false, code: 404, message: 'USER_ID not found' };

    const dup = await hasActiveVerification(connection, user_id);
    if (dup) return { success: false, code: 409, message: 'Verification already exists for this user' };

    const result = await connection.execute(
        `INSERT INTO EMPLOYEE_VERIFICATION (USER_ID, STATUS, DOCUMENT_LINK)
         VALUES (:user_id, 'Pending', :document_link)
         RETURNING VERIFICATION_ID INTO :vid`,
        { user_id, document_link, vid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
        { autoCommit: true }
    );
    return { success: true, verificationId: result.outBinds.vid[0] };
}

async function getPendingVerifications(connection) {
    const result = await connection.execute(
        `SELECT EV.VERIFICATION_ID, EV.USER_ID, EV.STATUS, EV.DOCUMENT_LINK,
                U.NAME, U.EMAIL, U.ROLE, U.PHONE
         FROM EMPLOYEE_VERIFICATION EV
         JOIN USERS U ON U.ID = EV.USER_ID
         WHERE EV.STATUS = 'Pending'
         ORDER BY EV.VERIFICATION_ID`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
}

async function approveVerification(connection, verificationId) {
    const verRes = await connection.execute(
        `SELECT VERIFICATION_ID, USER_ID, STATUS FROM EMPLOYEE_VERIFICATION WHERE VERIFICATION_ID = :id FOR UPDATE`,
        { id: verificationId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const ver = verRes.rows[0];
    if (!ver) return { success: false, code: 404, message: 'Verification not found' };
    if (ver.STATUS !== 'Pending') return { success: false, code: 400, message: 'Only pending verifications can be approved' };

    const user = await userExists(connection, ver.USER_ID);
    if (!user) return { success: false, code: 404, message: 'User not found for this verification' };

    let employeeId = await getEmployeeByUserId(connection, ver.USER_ID);
    if (!employeeId) employeeId = await insertEmployeeFromUser(connection, user);

    await connection.execute(
        `UPDATE EMPLOYEE_VERIFICATION 
         SET STATUS = 'Approved', EMPLOYEE_ID = :employeeId
         WHERE VERIFICATION_ID = :id`,
        { employeeId, id: verificationId },
        { autoCommit: true }
    );

    return { success: true, employeeId };
}

async function rejectVerification(connection, verificationId) {
    const verRes = await connection.execute(
        `SELECT VERIFICATION_ID, STATUS FROM EMPLOYEE_VERIFICATION WHERE VERIFICATION_ID = :id FOR UPDATE`,
        { id: verificationId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const ver = verRes.rows[0];
    if (!ver) return { success: false, code: 404, message: 'Verification not found' };
    if (ver.STATUS !== 'Pending') return { success: false, code: 400, message: 'Only pending verifications can be rejected' };

    await connection.execute(
        `UPDATE EMPLOYEE_VERIFICATION SET STATUS = 'Rejected' WHERE VERIFICATION_ID = :id`,
        { id: verificationId },
        { autoCommit: true }
    );

    return { success: true };
}

async function getApprovedEmployees(connection) {
    const result = await connection.execute(
        `SELECT E.EMPLOYEE_ID, E.NAME, E.EMAIL, E.PHONE, E.ROLE, E.STATUS, E.USER_ID
         FROM EMPLOYEE_VERIFICATION EV
         JOIN EMPLOYEES E ON E.EMPLOYEE_ID = EV.EMPLOYEE_ID
         WHERE EV.STATUS = 'Approved'
         ORDER BY E.EMPLOYEE_ID`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
}

module.exports = {
    createVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getApprovedEmployees
};
