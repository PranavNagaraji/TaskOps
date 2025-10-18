const oracledb = require('oracledb');
const db = require('../config/db');
const { getAllEmployees, addEmployee, updateEmployeeStatus, deleteEmployee, getActiveEmployees } = require('../models/employeesModel');

async function getEmployees(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getAllEmployees(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getActiveEmployeesController(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await getActiveEmployees(connection);
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addOneEmployee(req, res) {
    let connection;
    try {
        const employee = req.body;
        connection = await oracledb.getConnection(db.config);
        await addEmployee(connection, employee);
        return res.status(201).json({ message: "Data added successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function updateStatus(req, res) {
    let connection;
    try {
        const { employeeId } = req.body;
        connection = await oracledb.getConnection(db.config);
        const result = await updateEmployeeStatus(connection, employeeId);
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        return res.status(200).json({ message: "Data updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteOneEmployee(req, res) {
    let connection;
    try {
        const { employeeId } = req.params;
        connection = await oracledb.getConnection(db.config);
        const result = await deleteEmployee(connection, employeeId);
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }
        return res.status(200).json({ message: "Data deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

module.exports = { getEmployees, addOneEmployee, updateStatus, deleteOneEmployee, getActiveEmployeesController };