import express from "express";

import Monitoring from "../repository/monitoring.js";
import {
  authenticate,
  authorizeRole,
  authorizeResource,
} from "./middleware.js";

const router = express.Router();

router.get(
  "/",
  (_, res) => {
    const message = "SparkPlug Monitoring API!";
    res.status(200).json({ message });
  }
);

router.get(
  "/:id",
  authenticate,
  authorizeRole(["staff", "owner"]),
  authorizeResource,
  async (req, res) => {
    try {
      const { id } = req.params;
      const events = await Monitoring.getEventByStationId(id);
      res.status(200).json(events);
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

export default router;
