const oracledb = require("oracledb");

async function getAllAssignments(connection) {
    const res = await connection.execute(`SELECT * FROM ASSIGNMENTS`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}
async function getAllRequestsAndAssignments(connection) {
    try {
        const assignedRes = await connection.execute(
            `
      SELECT 
        a.ASSIGNMENT_ID,
        a.REQUEST_ID,
        a.EMPLOYEE_ID,
        a.ASSIGNED_AT,
        a.COMPLETED_AT AS ASSIGNMENT_COMPLETED_AT,
        r.CUSTOMER_ID,
        r.SERVICE_ID,
        s.NAME AS SERVICE_NAME,
        r.STATUS AS REQUEST_STATUS,
        r.CREATED_AT AS REQUEST_CREATED_AT,
        r.CLOSED_AT AS REQUEST_CLOSED_AT,
        e.NAME AS EMPLOYEE_NAME,
        e.PHONE AS EMPLOYEE_PHONE,
        e.EMAIL AS EMPLOYEE_EMAIL,
        c.NAME AS CUSTOMER_NAME,
        c.PHONE AS CUSTOMER_PHONE,
        c.EMAIL AS CUSTOMER_EMAIL,
        c.ADDRESS AS CUSTOMER_ADDRESS
      FROM ASSIGNMENTS a
      JOIN REQUESTS r ON a.REQUEST_ID = r.REQUEST_ID
      JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
      JOIN EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
      ORDER BY r.CREATED_AT DESC
      `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const unassignedRes = await connection.execute(
            `
      SELECT 
        r.REQUEST_ID,
        r.CUSTOMER_ID,
        r.SERVICE_ID,
        r.STATUS AS REQUEST_STATUS,
        s.NAME AS SERVICE_NAME,
        r.CREATED_AT AS REQUEST_CREATED_AT,
        r.CLOSED_AT AS REQUEST_CLOSED_AT,
        c.NAME AS CUSTOMER_NAME,
        c.PHONE AS CUSTOMER_PHONE,
        c.EMAIL AS CUSTOMER_EMAIL,
        c.ADDRESS AS CUSTOMER_ADDRESS
      FROM REQUESTS r
      LEFT JOIN ASSIGNMENTS a ON r.REQUEST_ID = a.REQUEST_ID
      JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
      JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
      WHERE a.REQUEST_ID IS NULL
      ORDER BY r.CREATED_AT DESC
      `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return {
            assigned: assignedRes.rows,
            unassigned: unassignedRes.rows,
        };
    } catch (err) {
        console.error("Error fetching requests and assignments:", err);
        throw err;
    }
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
    const result2 = await connection.execute(
        `UPDATE REQUESTS 
        SET CLOSED_AT = SYSTIMESTAMP
        WHERE REQUEST_ID = (SELECT REQUEST_ID FROM ASSIGNMENTS WHERE ASSIGNMENT_ID = :assignmentId)`,
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
        c.ADDRESS as CUSTOMER_ADDRESS,
        c.EMAIL as CUSTOMER_EMAIL
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


module.exports = { getAllAssignments, getAllRequestsAndAssignments, addAssignment, markAssignmentAsCompleted, deleteAssignment, getAssignmentsByEmployee };