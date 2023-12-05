import express from "express";
// import authorityJWT from "../middlewares/authorityJWT.js";

import {
  getAllUsers,
  getUserById,
  addUser,
  updateUserById,
  deleteUserById,
  getUserByRfid,
} from "../controllers/UserController.js";

const router = express.Router();
router.get("/", getAllUsers);
router.get("/rfid", getUserByRfid);
router.get("/:id", getUserById);
router.post("/", addUser);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);

// router.get("/protected-route", authenticateJWT, (req, res) => {
//   // ... protected route logic ...
// });

export default router;
