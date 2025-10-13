const oracledb=require("oracledb");
const paymentsModel=require("../models/paymentsModel");
const db=require("../config/db");

async function getPayments(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const payments = await paymentsModel.getAllPayments(connection);
        res.status(200).json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function addOnePayment(req, res) {
    const { requestId, amount, paymentMethod, status } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        await paymentsModel.addPayment(connection, { requestId, amount, paymentMethod, status });
        res.status(201).json({ message: 'Payment added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function updateOnePaymentStatus(req, res) {
    const { paymentId } = req.params;
    const { status } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const rowsAffected = await paymentsModel.updatePaymentStatus(connection, paymentId, status);
        if (rowsAffected === 0) return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function deleteOnePayment(req, res) {
    const { paymentId } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const rowsAffected = await paymentsModel.deletePayment(connection, paymentId);
        if (rowsAffected === 0) return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

module.exports={getPayments, addOnePayment, updateOnePaymentStatus, deleteOnePayment};