import cors from "cors";
import express from "express";
import helmet from "helmet";

import { WEB_DOMAIN } from "./config.js";
import monitoringRoutes from "./route.js";

// Initiate express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set CORS Policy
app.use(cors({ origin: WEB_DOMAIN }));

// Set security-related HTTP response headers
app.use(helmet());

// Setup api routes
const appRoutes = express.Router();
appRoutes.use("/monitoring", monitoringRoutes);

// API endpoints
app.use("/api", appRoutes);

app.use((req, res) => {
  const message = `The requested URL ${req.url} was not found on server.`;
  res.status(404).json({ message });
});

export default app;
