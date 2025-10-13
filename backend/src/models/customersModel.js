const oracledb=require('oracledb');

async function getAllCustomers(connection){
    const result = await connection.execute("SELECT * FROM CUSTOMERS", 
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
}

async function addCustomer(connection, customer){
    const {name, phone, email, address, user_id}=customer;
    const result=await connection.execute(`INSERT INTO CUSTOMERS(NAME, PHONE, EMAIL, ADDRESS, USER_ID) 
            VALUES(:name, :phone, :email, :address, :user_id)`,
        {name, phone, email, address, user_id},
        {autoCommit:true}
    );
    return result;
}

async function deleteCustomer(connection, customer_id){
    const result= await connection.execute(`DELETE FROM CUSTOMERS WHERE CUSTOMER_ID=:customer_id`, 
        {customer_id},
        {autoCommit:true}
    );
    return result;
}

async function getCustomerByUser(connection, user_id){
    const result=await connection.execute(`SELECT * FROM CUSTOMERS WHERE USER_ID=:user_id`, 
        {user_id},
        {outFormat:oracledb.OUT_FORMAT_OBJECT}
    );
    return result.rows;
}

async function createRequest(connection, userId, serviceId) {
    const sql = `
      INSERT INTO REQUESTS (CUSTOMER_ID, SERVICE_ID, STATUS, CREATED_AT)
      SELECT c.CUSTOMER_ID, :serviceId, 'Processing', SYSTIMESTAMP
      FROM CUSTOMERS c
      WHERE c.USER_ID = :userId
      RETURNING REQUEST_ID INTO :requestId
    `;

    const binds = {
      serviceId,
      userId,
      requestId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await connection.execute(sql, binds, { autoCommit: true });

    return result.outBinds.requestId[0];
}



module.exports={getAllCustomers, addCustomer, deleteCustomer, getCustomerByUser, createRequest};