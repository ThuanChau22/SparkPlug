import express from "express";

import {
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/UserController.js";
import {
  authenticate,
  authorizeRole,
  authorizeResource,
} from "../middlewares/auth.js";
import User from "../repositories/UserRepository.js";

const router = express.Router();
router.get("/", authenticate, authorizeRole(User.Role.Staff), getUsers);
router.get("/:id", authenticate, authorizeResource, getUserById);
router.put("/:id", authenticate, authorizeResource, updateUserById);
router.delete("/:id", authenticate, authorizeResource, deleteUserById);

export default router;
