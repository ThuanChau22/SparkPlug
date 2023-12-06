import ocppServer from "./ocpp/server.js";
import wsServer from "./ws/server.js";
import app from "./app.js";
import { PORT } from "./config.js";

app.listen(PORT, () => {
  console.log(`Monitoring server running on port: ${PORT}`);
}).on("upgrade", (request, socket, head) => {
  const [_, path] = request.url.split("/");
  if (path && path === "monitoring") {
    wsServer.handleUpgrade(request, socket, head);
  } else if (path && path === "ocpp") {
    ocppServer.handleUpgrade(request, socket, head);
  } else {
    socket.destroy();
  }
});
