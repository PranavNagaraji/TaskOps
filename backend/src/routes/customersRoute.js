const express=require('express');
const router=express.Router();
const {getCustomers, addCustomer, deleteCustomer, getCustomerByUser} = require("../controllers/customersController");

router.get("/", getCustomers);
router.post("/", addCustomer);
router.delete("/:customer_id", deleteCustomer);
router.get("/:user_id", getCustomerByUser);

module.exports=router;