import apiApp from "./api/app.js";
import wsApp from "./ws/app.js";
import {
  PORT,
  connectMongoDB,
  setGracefulShutdown,
} from "./config.js";

const main = async () => {
  try {
    await connectMongoDB();
    const httpServer = apiApp.listen(PORT, () => {
      console.log(`Monitoring server running on port: ${PORT}`);
    }).on("upgrade", (request, socket, head) => {
      wsApp.handleUpgrade(request, socket, head);
    });
    const wsServers = wsApp.routes.map(({ server }) => server);
    httpServer.WebSocketServers = wsServers;
    setGracefulShutdown(httpServer);
  } catch (error) {
    console.log(error);
  }
};
main();
