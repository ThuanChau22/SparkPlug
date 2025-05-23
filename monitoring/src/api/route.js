import express from "express";

import StationEvent from "../repositories/station-event.js";
import StationStatus from "../repositories/station-status.js";
import {
  authenticate,
  authorizeRole,
  authorizeResource,
  handleParameters,
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
  handleParameters,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sort_by, cursor, limit, ...filter } = req.query;
      filter.stationId = parseInt(id);
      const params = { filter, sort: sort_by, cursor, limit };
      const data = await StationEvent.getEvents(params);
      res.status(200).json(data);
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
  handleParameters,
  async (req, res) => {
    try {
      const { sort_by, cursor, limit, ...filter } = req.query;
      const params = { filter, sort: sort_by, cursor, limit };
      const data = await StationStatus.getStatuses(params);
      res.status(200).json(data);
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
  handleParameters,
  async (req, res) => {
    try {
      const filter = req.query;
      const data = await StationStatus.getStatusCount({ filter });
      res.status(200).json(data);
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
      const params = { filter: { stationId: parseInt(id) } };
      const { data } = await StationStatus.getStatuses(params);
      res.status(200).json(data);
    } catch (error) {
      const { message } = error;
      res.status(400).json({ message });
    }
  }
);

export default router;
