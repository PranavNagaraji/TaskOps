const oracledb=require('oracledb')

async function getAllEmployees(connection){
    const res=await connection.execute(`SELECT * FROM EMPLOYEES`,
        [],
        {outFormat:oracledb.OUT_FORMAT_OBJECT}
    );
    return res.rows;
}

async function addEmployee(connection, employee) {
    const { name, phone, email, role, hireDate, status, user_id } = employee;
    await connection.execute(
        `INSERT INTO EMPLOYEES (NAME, PHONE, EMAIL, ROLE, HIRE_DATE, STATUS, USER_ID)
         VALUES (:name, :phone, :email, :role, :hireDate, :status, :user_id)`,
        {
            name,
            phone,
            email,
            role,
            hireDate: hireDate || new Date(),
            status: status || 'Active',
            user_id
        },
        { autoCommit: true }
    );
}

async function updateEmployeeStatus(connection, employeeId){
    const result=await connection.execute(`UPDATE EMPLOYEES SET STATUS='Inactive' WHERE EMPLOYEE_ID=:employeeId`,
        {employeeId},
        {autoCommit:true}
    );
        if(result.rowsAffected===0){
        return {success:false, message:`No employee found with ID ${employeeId}`};
    }else{
        return {success:true, message:`Employee with ID ${employeeId} deleted successfully`};
    }
}

async function deleteEmployee(connection, employeeId) {
    const result = await connection.execute(
        `DELETE FROM EMPLOYEES WHERE EMPLOYEE_ID = :employeeId`,
        { employeeId },
        { autoCommit: true }
    );
    if(result.rowsAffected===0){
        return {success:false, message:`No employee found with ID ${employeeId}`};
    }else{
        return {success:true, message:`Employee with ID ${employeeId} deleted successfully`};
    }
}


module.exports={getAllEmployees, addEmployee, updateEmployeeStatus, deleteEmployee};