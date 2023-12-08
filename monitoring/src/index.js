import ocppServer from "./ocpp/server.js";
import wsServer from "./ws/server.js";
import app from "./app.js";
import {
  PORT,
  connectMongoDB,
  setGracefulShutdown,
} from "./config.js";

const server = app.listen(PORT, async () => {
  try {
    await connectMongoDB();
    console.log(`Monitoring server running on port: ${PORT}`);
  } catch (error) {
    console.log(error);
  }
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
setGracefulShutdown({ server, ocppServer, wsServer });
