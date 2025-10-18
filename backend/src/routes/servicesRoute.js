const express = require('express');
const router = express.Router();
const { getServices, addService, deleteService, updateService, getServiceByid } = require('../controllers/servicesController');

router.get("/", getServices);
router.get("/:id", getServiceByid);
router.post("/", addService);
router.delete("/:id", deleteService);
router.put("/:id", updateService);

module.exports = router;