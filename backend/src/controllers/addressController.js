const oracledb = require('oracledb');
const db = require('../config/db');
const Users = require('../models/usersModel');
const Addresses = require('../models/addressesModel');

async function addAddress(req, res) {
  let connection;
  try {
    const { user_id, latitude, longitude } = req.body || {};
    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({ message: 'user_id, latitude and longitude are required' });
    }

    connection = await oracledb.getConnection(db.config);

    const user = await Users.getById(connection, user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newId = await Addresses.addAddress(connection, {
      user_id: Number(user_id),
      latitude: String(latitude),
      longitude: String(longitude)
    });

    res.status(201).json({ message: 'Address saved', addressId: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

async function getAddressesByUser(req, res) {
  let connection;
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    connection = await oracledb.getConnection(db.config);

    const user = await Users.getById(connection, userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rows = await Addresses.getByUserId(connection, Number(userId));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { addAddress, getAddressesByUser };
