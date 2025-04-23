import cors from "cors";
import express from "express";
import helmet from "helmet";

import { WEB_DOMAINS } from "./config.js";
import authRoutes from "./routes/AuthRoutes.js";
import userRoutes from "./routes/UserRoutes.js";

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
appRoutes.use("/auth", authRoutes);
appRoutes.use("/users", userRoutes);
app.use("/api", appRoutes);

// Not found message
app.use((req, res) => {
  const message = `The requested URL ${req.url} was not found on server.`;
  res.status(404).json({ message });
});

export default app;
