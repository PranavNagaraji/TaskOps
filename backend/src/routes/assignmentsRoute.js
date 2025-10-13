const express = require("express");
const { getAssignments, addOneAssignment, markCompleted, deleteOneAssignment, getAssignmentsByEmployeeId } = require("../controllers/assignmentsController");

const router = express.Router();

router.get("/", getAssignments);
router.get("/employee/:userId", getAssignmentsByEmployeeId);
router.post("/", addOneAssignment);
router.patch("/", markCompleted);
router.delete("/:assignmentId", deleteOneAssignment);

module.exports = router;