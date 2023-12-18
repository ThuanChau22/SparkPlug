import express from "express";

import { getEventByStationId } from "./controller.js";
import {
  authenticate,
  authorizeRole,
  authorizeResource,
} from "./middleware.js";

const router = express.Router();
router.get("/", (_, res) => {
  const message = "SparkPlug Monitoring API!";
  res.status(200).json({ message });
});
router.get(
  "/:id",
  authenticate,
  authorizeRole(["staff", "owner"]),
  authorizeResource,
  getEventByStationId
);

export default router;
