const oracledb = require("oracledb");
const db = require("../config/db.js");
const Users = require("../models/usersModel");
const bcrypt = require("bcrypt");

async function addUser(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const { name, email, password, role, phone } = req.body;
        const password_hash = await bcrypt.hash(password, 10);
        const newUserId = await Users.addUser(connection, { name, email, password_hash, role, phone });
        res.status(201).json({
            message: "User added successfully",
            userId: newUserId // The newly created ID
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function getAllUsers(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const users = await Users.getAll(connection);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function getUserById(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        const user = await Users.getById(connection, req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function deleteUser(req, res) {
    let connection;
    try {
        connection = await oracledb.getConnection(db.config);
        await Users.deleteUser(connection, req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

async function loginUser(req, res) {
    let connection;
    const { email, password } = req.body;
    try {
        connection = await oracledb.getConnection(db.config);
        const user = await Users.getUserByEmail(connection, email);
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        const { ID, NAME, EMAIL, ROLE } = user;
        res.json({ id: ID, name: NAME, email: EMAIL, role: ROLE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
}

module.exports = { addUser, getAllUsers, getUserById, deleteUser, loginUser };