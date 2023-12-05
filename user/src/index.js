import dotenv from "dotenv";
dotenv.config();
import express from "express";

import authRouter from "./routes/AuthRoutes.js";
import userRouter from "./routes/UserRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => console.log(`It's alive on http://localhost:${PORT}`));
