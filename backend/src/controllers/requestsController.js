const oracledb = require('oracledb');
const { getAllRequestsModel, addRequest, updateRequestStatus, deleteRequest, getAllRequestsWithDetails, setUnassignedInProgressToPending } = require("../models/requestsModel");
const db = require("../config/db");

async function getAllRequests(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllRequestsModel(connection);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addOneRequest(req, res) {
    let connection;
    try {
        const { customerId, serviceId } = req.body;
        connection = await oracledb.getConnection(db.config);
        await addRequest(connection, customerId, serviceId);
        res.status(201).json({ message: "Request added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function updateStatus(req, res) {
    let connection;
    try {
        const { requestId, status } = req.body;
        connection = await oracledb.getConnection(db.config);
        await updateRequestStatus(connection, requestId, status);
        res.status(200).json({ message: "Request's status updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteOneRequest(req, res) {
    let connection;
    try {
        const { requestId } = req.params;
        connection = await oracledb.getConnection(db.config);
        await deleteRequest(connection, requestId);
        res.status(200).json({ message: `Request ${requestId} deleted succesfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function updateUnassignedInProgress(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const updatedCount = await setUnassignedInProgressToPending(connection);
        res.status(200).json({ message: `${updatedCount} requests updated to Pending.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function getRequests(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllRequestsWithDetails(connection);
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

module.exports = { getAllRequests, addOneRequest, updateStatus, deleteOneRequest, getRequests, updateUnassignedInProgress };
