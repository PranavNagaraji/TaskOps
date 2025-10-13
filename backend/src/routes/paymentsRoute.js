const express=require("express");
const paymentsController=require("../controllers/paymentsController")
const router=express.Router();

router.get("/", paymentsController.getPayments);
router.post("/", paymentsController.addOnePayment);
router.put("/:paymentId", paymentsController.updateOnePaymentStatus);
router.delete("/:paymentId", paymentsController.deleteOnePayment);

module.exports=router;