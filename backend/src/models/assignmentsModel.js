const oracledb = require("oracledb");

async function getAllAssignments(connection) {
    const res = await connection.execute(`SELECT * FROM ASSIGNMENTS`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}

async function addAssignment(connection, requestId, employeeId) {
    await connection.execute(
        `INSERT INTO ASSIGNMENTS (REQUEST_ID, EMPLOYEE_ID)
            VALUES (:requestId, :employeeId)`,
        { requestId, employeeId },
        { autoCommit: true }
    );
    await connection.execute(
        `UPDATE REQUESTS 
         SET STATUS = 'In Progress'
         WHERE REQUEST_ID = :requestId`,
        { requestId },
        { autoCommit: true }
    );
}

async function markAssignmentAsCompleted(connection, assignmentId) {
    const result = await connection.execute(
        `UPDATE ASSIGNMENTS 
        SET COMPLETED_AT = SYSTIMESTAMP
        WHERE ASSIGNMENT_ID = :assignmentId`,
        { assignmentId },
        { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
        return { success: false, message: `No assignment found with ID ${assignmentId}` };
    }
    await connection.execute(
        `UPDATE REQUESTS 
         SET STATUS = 'Completed'
         WHERE REQUEST_ID = (
            SELECT REQUEST_ID FROM ASSIGNMENTS WHERE ASSIGNMENT_ID = :assignmentId
         )`,
        { assignmentId },
        { autoCommit: true }
    );
    return { success: true, message: `The assignment has been marked completed.` };
}

async function deleteAssignment(connection, assignmentId) {
    const result = await connection.execute(`DELETE FROM ASSIGNMENTS 
        WHERE ASSIGNMENT_ID=:assignmentId`,
        { assignmentId },
        { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
        return { success: false, message: `No assignment found with ID ${assignmentId}` };
    }
    return { success: true, message: `The assignment has been marked completed` };
}

async function getAssignmentsByEmployee(connection, userId) {
    const empResult = await connection.execute(
        `SELECT EMPLOYEE_ID FROM EMPLOYEES WHERE USER_ID = :userId`,
        { userId }
    );
    const employeeId = empResult.rows?.[0]?.[0];
    if (!employeeId) {
        return [];
    }
    const result = await connection.execute(
        `SELECT 
        a.ASSIGNMENT_ID,
        a.REQUEST_ID,
        a.COMPLETED_AT,
        r.SERVICE_ID,
        r.STATUS,
        r.CREATED_AT,
        s.NAME as SERVICE_NAME,
        s.COST,
        c.NAME as CUSTOMER_NAME,
        c.PHONE as CUSTOMER_PHONE,
        c.ADDRESS as CUSTOMER_ADDRESS
     FROM ASSIGNMENTS a
     JOIN REQUESTS r ON a.REQUEST_ID = r.REQUEST_ID
     JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
     JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
     WHERE a.EMPLOYEE_ID = :employeeId
     ORDER BY r.CREATED_AT DESC`,
        { employeeId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );


    return result.rows;
}


module.exports = { getAllAssignments, addAssignment, markAssignmentAsCompleted, deleteAssignment, getAssignmentsByEmployee };