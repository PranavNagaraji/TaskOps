const oracledb = require("oracledb");

async function getAllPayments(connection) {
    const data = await connection.execute(
        `SELECT * FROM PAYMENTS ORDER BY PAYMENT_DATE DESC`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return data.rows;
}

async function addPayment(connection, paymentBody) {
    const { requestId, amount, paymentMethod, status } = paymentBody;
    const result = await connection.execute(
        `INSERT INTO PAYMENTS (REQUEST_ID, AMOUNT, PAYMENT_METHOD, STATUS)
         VALUES (:requestId, :amount, :paymentMethod, :status)`,
        {
            requestId,
            amount,
            paymentMethod: paymentMethod.toUpperCase(),
            status: status.toUpperCase()
        },
        { autoCommit: true }
    );

    return result;
}

async function updatePaymentStatus(connection, paymentId, status) {
    const result = await connection.execute(
        `UPDATE PAYMENTS SET STATUS = :status WHERE PAYMENT_ID = :paymentId`,
        { status: status.toUpperCase(), paymentId },
        { autoCommit: true }
    );
    return result.rowsAffected;
}

async function deletePayment(connection, paymentId) {
    const result = await connection.execute(
        `DELETE FROM PAYMENTS WHERE PAYMENT_ID = :paymentId`,
        { paymentId },
        { autoCommit: true }
    );
    return result.rowsAffected;
}

module.exports = {
    getAllPayments,
    addPayment,
    updatePaymentStatus,
    deletePayment
};
