import express from "express";
import authorityJWT from "../middlewares/authorityJWT.js";

import { userLogin, userSignUp } from "../controllers/AuthController.js";

const router = express.Router();
router.post("/auth/login", userLogin);
router.post("/auth/signup", userSignUp);

router.get("/protected-route", authorityJWT, (req, res) => {
  // ... protected route logic ...
});

export default router;
