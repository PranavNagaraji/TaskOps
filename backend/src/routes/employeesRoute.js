const oracledb = require('oracledb');
const { getEmployees, updateStatus, deleteOneEmployee, addOneEmployee, getActiveEmployeesController, getInactiveEmployeesController } = require("../controllers/employeesController");
const express = require('express');
const router = express.Router();

router.get("/", getEmployees);
router.get("/active", getActiveEmployeesController);
router.get("/inactive", getInactiveEmployeesController);
router.post("/", addOneEmployee)
router.put("/", updateStatus);
router.delete("/:employeeId", deleteOneEmployee);

module.exports = router;