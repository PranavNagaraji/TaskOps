const express=require('express');
const {loginUser}=require("../controllers/usersController");

const router=express.Router();

router.post("/login", loginUser);

module.exports=router;