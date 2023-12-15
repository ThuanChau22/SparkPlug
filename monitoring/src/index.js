import ocppServer from "./ocpp/server.js";
import wsServer from "./ws/server.js";
import app from "./app.js";
import {
  PORT,
  connectMongoDB,
  setGracefulShutdown,
} from "./config.js";

const main = async () => {
  try {
    await connectMongoDB();
    const server = app.listen(PORT, () => {
      console.log(`Monitoring server running on port: ${PORT}`);
    }).on("upgrade", (request, socket, head) => {
      const { pathname } = new URL(request.url, "http://localhost");
      const [_, path] = pathname.split("/");
      if (path === "monitoring") {
        wsServer.handleUpgrade(request, socket, head);
      } else if (path === "ocpp") {
        ocppServer.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });
    setGracefulShutdown({ server, ocppServer, wsServer });
  } catch (error) {
    console.log(error);
  }
};
main();
