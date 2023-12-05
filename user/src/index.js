import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRouter from "./routes/AuthRoutes.js";
import userRouter from "./routes/UserRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: process.env.WEB_DOMAIN }));

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => console.log(`It's alive on http://localhost:${PORT}`));
