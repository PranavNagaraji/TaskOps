const oracledb = require('oracledb')

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
    const result = await connection.execute(
        `DELETE FROM EMPLOYEES WHERE EMPLOYEE_ID = :employeeId`,
        { employeeId },
        { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
        return { success: false, message: `No employee found with ID ${employeeId}` };
    } else {
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