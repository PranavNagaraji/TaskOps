const oracledb = require("oracledb");
const db = require("../config/db.js");
const Customers = require("../models/customersModel");

//GET /api/customers
async function getCustomers(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const data = await Customers.getAllCustomers(connection);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

//POST /api/customers
async function addCustomer(req, res) {
    let connection;
    const { name, phone, email, address, user_id } = req.body;
    try {
        connection = await oracledb.getConnection(db.config);
        await Customers.addCustomer(connection, { name, phone, email, address, user_id });
        res.status(201).json({ message: "Customer added Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function deleteCustomer(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const { customer_id } = req.params; //change this to body/params if needed
        await Customers.deleteCustomer(connection, customer_id);
        res.status(200).json({ message: "Customer deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function getCustomerByUser(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const { user_id } = req.params;
        const data = await Customers.getCustomerByUser(connection, user_id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection)
            await connection.close();
    }
}

async function addRequest(req, res) {
    let connection;
    try {
        const { serviceId, userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId is required" });
        if (!serviceId) return res.status(400).json({ error: "serviceId is required" });

        connection = await oracledb.getConnection(dbConfig);
        const requestId = await RequestModel.createRequest(connection, userId, serviceId);
        res.status(201).json({ message: "Request created", requestId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

module.exports = { getCustomers, addCustomer, deleteCustomer, getCustomerByUser, addRequest };