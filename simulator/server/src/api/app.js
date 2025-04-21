import cors from "cors";
import express from "express";
import helmet from "helmet";

import { WEB_DOMAINS } from "../config.js";

// Initiate express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set CORS Policy
app.use(cors({ origin: WEB_DOMAINS }));

// Set security-related HTTP response headers
app.use(helmet());

// Setup api routes
const appRoutes = express.Router();

// Greeting message
appRoutes.get("/simulator", (_, res) => {
  const message = "SparkPlug Charging Station Simulator API!";
  res.status(200).json({ message });
});

// API endpoints
app.use("/api", appRoutes);

app.use((req, res) => {
  const message = `The requested URL ${req.url} was not found on server.`;
  res.status(404).json({ message });
});

export default app;
