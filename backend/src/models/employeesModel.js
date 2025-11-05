const oracledb = require('oracledb')
const mailSender = require('../utils/mailSender')

async function getAllEmployees(connection) {
    const res = await connection.execute(`SELECT * FROM EMPLOYEES`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}

async function getActiveEmployees(connection) {
    const res = await connection.execute(`SELECT * FROM EMPLOYEES WHERE STATUS='Active'`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}

async function getInactiveEmployees(connection) {
    const res = await connection.execute(`SELECT * FROM EMPLOYEES WHERE STATUS='Inactive'`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}

async function addEmployee(connection, employee) {
    const { name, phone, email, role, hireDate, status, user_id } = employee;
    await connection.execute(
        `INSERT INTO EMPLOYEES (NAME, PHONE, EMAIL, ROLE, HIRE_DATE, STATUS, USER_ID)
         VALUES (:name, :phone, :email, :role, :hireDate, :status, :user_id)`,
        {
            name,
            phone,
            email,
            role,
            hireDate: hireDate || new Date(),
            status: status || 'Active',
            user_id
        },
        { autoCommit: true }
    );
}

async function updateEmployeeStatus(connection, userId, status) {
    const res = await connection.execute(`SELECT EMPLOYEE_ID FROM EMPLOYEES WHERE USER_ID=:userId`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const employeeId = res.rows[0]?.EMPLOYEE_ID;
    if (!employeeId) {
        return { success: false, message: `No employee found for this user` };
    }
    const result = await connection.execute(`UPDATE EMPLOYEES SET STATUS=:status WHERE EMPLOYEE_ID=:employeeId`,
        { status, employeeId },
        { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
        return { success: false, message: `No employee found with ID ${employeeId}` };
    } else {
        return { success: true, message: `Employee with ID ${employeeId} deleted successfully` };
    }
}

async function deleteEmployee(connection, employeeId) {
    const pre = await connection.execute(
        `SELECT NAME, EMAIL FROM EMPLOYEES WHERE EMPLOYEE_ID = :employeeId`,
        { employeeId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const email = pre?.rows?.[0]?.EMAIL;
    const name = pre?.rows?.[0]?.NAME;

    const result = await connection.execute(
        `DELETE FROM EMPLOYEES WHERE EMPLOYEE_ID = :employeeId`,
        { employeeId },
        { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
        return { success: false, message: `No employee found with ID ${employeeId}` };
    } else {
        if (email) {
            const subject = 'Account removed due to inactivity';
            const appName = process.env.MJ_SENDER_NAME || 'TaskOps';
            const html = `
<div style="font-family: Arial, sans-serif; color:#111;">
  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; max-width:560px; margin:auto;">
    <h2 style="margin:0 0 12px; color:#111;">${appName}: Account removed due to inactivity</h2>
    <p style="margin:0 0 12px; line-height:1.6;">Hi ${name || ''},</p>
    <p style="margin:0 0 12px; line-height:1.6;">Your employee account has been removed due to prolonged inactivity.</p>
    <p style="margin:0 0 12px; line-height:1.6;">If you believe this was a mistake, please contact support.</p>
    <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">This is an automated message.</p>
  </div>
</div>`;
            try { await mailSender({ email, subject, content: html }); } catch (e) { try { console.error('Removal email error:', e?.response?.body || e?.message || e); } catch(_) {} }
        }
        return { success: true, message: `Employee with ID ${employeeId} deleted successfully` };
    }
}

async function updateRole(connection, id, newRole) {
    const sql = `
        UPDATE EMPLOYEES
        SET ROLE = :newRole
        WHERE EMPLOYEE_ID = :id
    `;
    await connection.execute(sql, { id, newRole }, { autoCommit: true });
}

async function getEmployeeByUserId(connection, userId) {
    const result = await connection.execute(
        `SELECT * FROM EMPLOYEES WHERE USER_ID = :userId`,
        [userId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows[0] || null;
}

module.exports = { 
    getAllEmployees, 
    addEmployee, 
    updateEmployeeStatus, 
    deleteEmployee, 
    getActiveEmployees, 
    getInactiveEmployees, 
    updateRole,
    getEmployeeByUserId 
};