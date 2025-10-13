const express = require("express");
const {
  addUser,
  getAllUsers,
  getUserById,
  deleteUser,
  loginUser
} = require("../controllers/usersController");
const router = express.Router();

router.post("/login", loginUser);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", addUser);
router.delete("/:id", deleteUser);

module.exports = router;