const oracledb = require('oracledb');

const Addresses = {
  async addAddress(connection, data) {
    const { user_id, latitude, longitude } = data;
    const sql = `
      INSERT INTO ADDRESSES (USER_ID, LATITUDE, LONGITUDE)
      VALUES (:user_id, :latitude, :longitude)
      RETURNING ADDRESS_ID INTO :new_address_id
    `;
    const binds = {
      user_id,
      latitude,
      longitude,
      new_address_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };
    const result = await connection.execute(sql, binds, { autoCommit: true });
    if (result.outBinds && result.outBinds.new_address_id) {
      return result.outBinds.new_address_id[0];
    }
    throw new Error('Failed to retrieve the new address ID after insert.');
  },

  async getByUserId(connection, userId) {
    const sql = `
      SELECT ADDRESS_ID, USER_ID, LATITUDE, LONGITUDE, CREATED_AT
      FROM ADDRESSES
      WHERE USER_ID = :userId
      ORDER BY CREATED_AT DESC
    `;
    const result = await connection.execute(sql, { userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows;
  }
};

module.exports = Addresses;
