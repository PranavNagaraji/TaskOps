const oracledb = require('oracledb');
const { getEmployees, updateStatus, deleteOneEmployee, addOneEmployee, getActiveEmployeesController, getInactiveEmployeesController, updateEmployeeRole } = require("../controllers/employeesController");
const express = require('express');
const router = express.Router();

router.get("/", getEmployees);
router.get("/active", getActiveEmployeesController);
router.get("/inactive", getInactiveEmployeesController);
router.post("/", addOneEmployee)
router.put("/", updateStatus);
router.put("/:id/role", updateEmployeeRole);
router.delete("/:employeeId", deleteOneEmployee);

module.exports = router;