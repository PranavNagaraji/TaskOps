const oracledb = require("oracledb");

const Users = {
    async addUser(connection, user) {
        const { name, email, password_hash, role, phone } = user;
        // 1. Add "RETURNING ID INTO :new_user_id" to the SQL query
        const sql = `
        INSERT INTO users (name, email, password_hash, role, phone)
        VALUES (:name, :email, :password_hash, :role, :phone)
        RETURNING ID INTO :new_user_id
        `;
        // 2. Define 'new_user_id' as an output bind variable
        const binds = {
            name,
            email,
            password_hash,
            role,
            phone,
            new_user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };
        const result = await connection.execute(sql, binds, { autoCommit: true });
        // 3. The new ID is in result.outBinds. Extract and return it.
        if (result.outBinds && result.outBinds.new_user_id) {
            const newId = result.outBinds.new_user_id[0];
            return newId;
        } else {
            throw new Error("Failed to retrieve the new user ID after insert.");
        }
    },

    async getAll(connection) {
        const sql = `SELECT id, name, email, role FROM users ORDER BY id`;
        const result = await connection.execute(sql, [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    },

    async getById(connection, id) {
        const sql = `SELECT id, name, email, role FROM users WHERE id = :id`;
        const result = await connection.execute(sql, [id]);
        return result.rows[0];
    },

    async deleteUser(connection, id) {
        await connection.execute(`DELETE FROM ADDRESSES WHERE USER_ID = :id`, [id], { autoCommit: true });
        await connection.execute(`DELETE FROM EMPLOYEE_VERIFICATION WHERE USER_ID = :id`, [id], { autoCommit: true });
        await connection.execute(`DELETE FROM EMPLOYEES WHERE USER_ID = :id`, [id], { autoCommit: true });
        await connection.execute(`DELETE FROM CUSTOMERS WHERE USER_ID = :id`, [id], { autoCommit: true });
        const sql = `DELETE FROM users WHERE id = :id`;
        await connection.execute(sql, [id], { autoCommit: true });
    },

    async getUserByEmail(connection, email) {
        const sql = `SELECT id, name, email, password_hash, role FROM users WHERE email = :email`;
        const result = await connection.execute(sql, [email], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows[0];
    }
};

module.exports = Users;