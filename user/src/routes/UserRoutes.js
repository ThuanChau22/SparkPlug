import express from "express";

import {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/UserController.js";
import {
  authenticate,
  authorizeRole,
  authorizeResource,
} from "../middlewares/auth.js";
import {
  Role,
} from "../repositories/UserRepository.js";

const router = express.Router();
router.get("/", authenticate, authorizeRole(Role.Staff), getAllUsers);
router.get("/:id", authenticate, authorizeResource, getUserById);
router.put("/:id", authenticate, authorizeResource, updateUserById);
router.delete("/:id", authenticate, authorizeResource, deleteUserById);

export default router;
