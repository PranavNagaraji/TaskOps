const express=require("express");
const router=express.Router();

const {getRequests, addOneRequest, updateStatus, deleteOneRequest, getAllRequests}=require('../controllers/requestsController');

router.get("/", getRequests);
router.get('/all', getAllRequests);
router.post('/', addOneRequest);
router.put('/', updateStatus);
router.delete('/:requestId', deleteOneRequest);

module.exports=router;