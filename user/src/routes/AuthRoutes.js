// AuthRoutes.js
import express from "express";
import { userLogin, userSignUp } from "../controllers/AuthController.js";
import { authenticateJWT, authorizeRole } from "../middlewares/authorityJWT.js";

const router = express.Router();

// Route for user sign-up
router.post("/signup", userSignUp);

// Route for user login
router.post("/login", userLogin);

// Example protected route accessible to any authenticated user
router.get("/protected-route", authenticateJWT, (req, res) => {
  res.json({ message: "You have accessed a protected route", user: req.user });
});

// Example protected route accessible only to specific roles
// Replace 'YourRole' with the actual role name like 'Driver', 'StationOwner', or 'Staff'
router.get(
  "/role-specific-route",
  authenticateJWT,
  authorizeRole("YourRole"),
  (req, res) => {
    res.json({
      message: "You have accessed a role-specific protected route",
      user: req.user,
    });
  }
);

export default router;
