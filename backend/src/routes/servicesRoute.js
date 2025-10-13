const express=require('express');
const router=express.Router();
const {getServices, addService, deleteService, updateService}=require('../controllers/servicesController');

router.get("/", getServices);
router.post("/", addService);
router.delete("/:id", deleteService);
router.put("/:id", updateService);

module.exports=router;