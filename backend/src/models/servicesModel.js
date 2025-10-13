const oracledb = require('oracledb');

async function getAllServices(connection) {
    const res = await connection.execute('SELECT * FROM SERVICES',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return res.rows;
}

async function addService(connection, service) {
    const { name, description, cost, duration, customer_id } = service;
    const res = await connection.execute(`INSERT INTO SERVICES(NAME, DESCRIPTION, COST, DURATION, CUSTOMER_ID)
        VALUES(:name, :description, :cost, :duration, :customer_id)`,
        { name, description, cost, duration, customer_id},
        { autoCommit: true },
    );
    return res;
}

async function updateService(connection, id, service) {
    const { name, description, cost, duration, status } = service;
    await connection.execute(
        `UPDATE SERVICES
         SET NAME = :name,
             DESCRIPTION = :description,
             COST = :cost,
             DURATION = TO_DSINTERVAL(:duration),
             STATUS = :status
         WHERE SERVICE_ID = :id`,
        { id, name, description, cost, duration, status },
        { autoCommit: true }
    );
}

async function deleteService(connection, id) {
    await connection.execute(
        `DELETE FROM SERVICES WHERE SERVICE_ID = :id`,
        { id },
        { autoCommit: true }
    );
}

module.exports = { getAllServices, addService, updateService, deleteService };