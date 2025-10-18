const oracledb = require("oracledb")

async function addRequest(connection, customerId, serviceId) {
    await connection.execute(
        `INSERT INTO REQUESTS (CUSTOMER_ID, SERVICE_ID)
         VALUES (:customerId, :serviceId)`,
        { customerId, serviceId },
        { autoCommit: true }
    );
}

async function setUnassignedInProgressToPending(connection) {
    const updateSql = `
        UPDATE REQUESTS
        SET STATUS = 'Pending'
        WHERE STATUS = 'In Progress'
          AND REQUEST_ID NOT IN (SELECT REQUEST_ID FROM ASSIGNMENTS)
    `;
    const result = await connection.execute(updateSql, [], { autoCommit: true });
    return result.rowsAffected;
}

async function updateRequestStatus(connection, requestId, status) {
    await connection.execute(
        `UPDATE REQUESTS
         SET STATUS = :status, CLOSED_AT = SYSTIMESTAMP
         WHERE REQUEST_ID = :requestId`,
        { status, requestId },
        { autoCommit: true }
    );
}

async function deleteRequest(connection, requestId) {
    await connection.execute(
        `DELETE FROM REQUESTS WHERE REQUEST_ID=:requestId`,
        { requestId },
        { autoCommit: true }
    );
}

async function getAllRequestsWithDetails(connection) {
    const sql = `
      SELECT 
        r.REQUEST_ID,
        c.NAME AS CUSTOMER_NAME,
        c.PHONE AS CUSTOMER_PHONE,
        c.ADDRESS AS CUSTOMER_ADDRESS,
        s.NAME AS SERVICE_NAME,
        r.STATUS,
        r.CREATED_AT,
        a.EMPLOYEE_ID,
        e.NAME AS EMPLOYEE_NAME
    FROM REQUESTS r
    JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
    JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
    LEFT JOIN ASSIGNMENTS a ON r.REQUEST_ID = a.REQUEST_ID
    LEFT JOIN EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
    ORDER BY r.CREATED_AT DESC`;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows;
}

async function getAllRequestsModel(connection) {
    const result = await connection.execute(
        `SELECT 
        r.REQUEST_ID, r.STATUS, r.CREATED_AT, 
        s.NAME AS SERVICE_NAME, s.COST,
        c.NAME AS CUSTOMER_NAME, c.PHONE, c.ADDRESS, r.CUSTOMER_ID
     FROM REQUESTS r
     JOIN SERVICES s ON r.SERVICE_ID = s.SERVICE_ID
     JOIN CUSTOMERS c ON r.CUSTOMER_ID = c.CUSTOMER_ID
     ORDER BY r.CREATED_AT DESC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
}

module.exports = { getAllRequestsModel, addRequest, updateRequestStatus, deleteRequest, getAllRequestsWithDetails, setUnassignedInProgressToPending };