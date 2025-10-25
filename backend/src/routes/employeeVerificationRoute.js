const express = require('express');
const {
  submitVerification,
  listPending,
  approve,
  reject,
  listApproved
} = require('../controllers/employeeVerificationController');

const router = express.Router();

// POST /api/employee-verification
router.post('/', submitVerification);

// GET /api/employee-verification/pending
router.get('/pending', listPending);

// PATCH /api/employee-verification/:id/approve
router.patch('/:id/approve', approve);

// PATCH /api/employee-verification/:id/reject
router.patch('/:id/reject', reject);

// GET /api/employee-verification/approved
router.get('/approved', listApproved);

module.exports = router;
