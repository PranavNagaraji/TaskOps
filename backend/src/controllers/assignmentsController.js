const oracledb = require('oracledb');
const db = require("../config/db");
const { getAllAssignments, addAssignment, markAssignmentAsCompleted, deleteAssignment, getAssignmentsByEmployee } = require("../models/assignmentsModel")

async function getAssignments(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllAssignments(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}
async function addOneAssignment(req, res) {
    const { requestId, userId } = req.body;
    const connection = await oracledb.getConnection(db.config)
    try {
        const result = await connection.execute(
            `SELECT EMPLOYEE_ID FROM EMPLOYEES WHERE USER_ID = :userId`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const employeeId = result.rows[0]?.EMPLOYEE_ID;
        if (!employeeId) {
            return res.status(404).json({ error: "Employee not found for this user" });
        }
        await addAssignment(connection, requestId, employeeId);
        res.status(201).json({ message: "Assignment added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

async function markCompleted(req, res) {
    let connection;
    try {
        const { assignmentId } = req.body;
        connection = await oracledb.getConnection(db.config);
        const data = await markAssignmentAsCompleted(connection, assignmentId);
        if (data.success == true)
            return res.status(200).json({ message: "Data modified successfully" });
        return res.status(404).json({ error: `No such entry with ${assignmentId} found` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteOneAssignment(req, res) {
    let connection;
    try {
        const { assignmentId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const data = await deleteAssignment(connection, assignmentId);
        if (data.success == true)
            return res.status(200).json({ message: "Data deleted successfully" });
        return res.status(404).json({ error: `No such entry with ${assignmentId} found` });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}
async function getAssignmentsByEmployeeId(req, res) {
    let connection;
    try {
        const { userId } = req.params;
        connection = await oracledb.getConnection(db.config);

        const data = await getAssignmentsByEmployee(connection, userId);
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching employee assignments:", err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}


module.exports = { getAssignments, addOneAssignment, markCompleted, deleteOneAssignment, getAssignmentsByEmployeeId };