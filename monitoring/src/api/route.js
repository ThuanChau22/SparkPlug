import express from "express";

import StationEvent from "../repositories/station-event.js";
import StationStatus from "../repositories/station-status.js";
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
  "/station-events/:id",
  authenticate,
  authorizeRole(["staff", "owner"]),
  authorizeResource,
  async (req, res) => {
    try {
      const { id } = req.params;
      const filter = {
        stationId: id,
        source: StationEvent.Sources.Station,
      };
      const sort = { createdAt: 1 };
      const events = await StationEvent.getEvents({ filter, sort });
      res.status(200).json(utils.toClient(events));
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

router.get(
  "/station-status",
  authenticate,
  authorizeRole(["staff", "owner", "driver"]),
  async (req, res) => {
    try {
      const { sort_by, cursor, limit, ...filter } = req.query;
      const params = { filter, sort: sort_by, cursor, limit: parseInt(limit) };
      params.limit = Number.isNaN(params.limit) ? 0 : params.limit;
      const stationStatus = await StationStatus.getStatuses(params);
      res.status(200).json(utils.toClient(stationStatus));
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

router.get(
  "/station-status/count",
  authenticate,
  authorizeRole(["staff", "owner", "driver"]),
  async (_, res) => {
    try {
      const count = await StationStatus.getStatusCount();
      res.status(200).json(utils.toClient(count));
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

router.get(
  "/station-status/:id",
  authenticate,
  authorizeRole(["staff", "owner", "driver"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const params = { filter: { stationId: id } };
      const { data } = await StationStatus.getStatuses(params);
      res.status(200).json(utils.toClient(data));
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

export default router;
