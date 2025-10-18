const express = require("express");
const router = express.Router();

const { getRequests, addOneRequest, updateStatus, deleteOneRequest, getAllRequests, updateUnassignedInProgress } = require('../controllers/requestsController');

router.get("/", getRequests);
router.get('/all', getAllRequests);
router.put('/incomplete', updateUnassignedInProgress);
router.post('/', addOneRequest);
router.put('/', updateStatus);
router.delete('/:requestId', deleteOneRequest);

module.exports = router;