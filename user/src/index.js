import express from "express";

// import authRouter from "./routes/AuthRoutes.js";
import userRouter from "./routes/UserRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/tshirt", (req, res) => {
  // request: incoming data, response: outgoing data(send back to the client)
  res.status(200).send({
    tshirt: "👔",
    size: "large",
  });
});

app.post("/tshirt/:id", (req, res) => {
  const { id } = req.params;
  const { logo } = req.body;

  if (!logo) {
    res.status(418).send({ message: "We need a logo!" });
  }

  res.send({
    tshirt: `👔 with your ${logo} and ID of ${id}`,
  });
});

app.use("/api/users", userRouter);

app.listen(PORT, () => console.log(`It's alive on http://localhost:${PORT}`));
