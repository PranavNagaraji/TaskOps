const express = require("express");
const { getAssignments, addOneAssignment, markCompleted, deleteOneAssignment, getAssignmentsByEmployeeId, getAllRequestsAndAssignmentsController, sendCompletionOtp, verifyCompletionOtp } = require("../controllers/assignmentsController");

const router = express.Router();

router.get("/", getAssignments);
router.get("/requests/all", getAllRequestsAndAssignmentsController);
router.get("/employee/:userId", getAssignmentsByEmployeeId);
router.post("/", addOneAssignment);
router.patch("/", markCompleted);
router.delete("/:assignmentId", deleteOneAssignment);
router.post("/:assignmentId/completion-otp", sendCompletionOtp);
router.post("/:assignmentId/verify-otp", verifyCompletionOtp);

module.exports = router;