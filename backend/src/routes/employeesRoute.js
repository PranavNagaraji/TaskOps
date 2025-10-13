const oracledb=require('oracledb');
const {getEmployees, updateStatus, deleteOneEmployee, addOneEmployee}=require("../controllers/employeesController");
const express=require('express');
const router=express.Router();

router.get("/", getEmployees);
router.post("/", addOneEmployee)
router.put("/", updateStatus);
router.delete("/:employeeId", deleteOneEmployee);

module.exports=router;