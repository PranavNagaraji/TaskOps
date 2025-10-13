const oracledb=require('oracledb');
require('dotenv').config()

const config={
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    connectString:process.env.DB_CONNECT
}
async function initDB(){
    try{
        const connection = await oracledb.getConnection(config);
        console.log("Connected to Oracle DB");
        const res=await connection.execute("Select 'Oracledb is now active' from dual");
        console.log(`Test result: ${res.rows}`);
        await connection.close();
    }catch(err){
        console.log("Cannot Connect to Oracle DB: ", err);
    }
}

module.exports={config, initDB};