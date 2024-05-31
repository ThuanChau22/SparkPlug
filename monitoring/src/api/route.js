import express from "express";

import Monitoring from "../repository/monitoring.js";
import utils from "../utils/utils.js";
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
      const filter = {
        stationId: id,
        source: Monitoring.Sources.Station,
      };
      const sort = { createdAt: 1 };
      const events = await Monitoring.getEvents({ filter, sort });
      res.status(200).json(utils.toClient(events));
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

export default router;
