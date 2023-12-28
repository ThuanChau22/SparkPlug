import { connectCSMS } from "./ocpp/client.js";
import wss from "./ws/server.js";
import app from "./app.js"
import {
  PORT,
  WEB_DOMAIN,
  STATION_IDENTITY,
} from "./config.js";

const main = async () => {
  try {
    await connectCSMS();
    app.listen(PORT, () => {
      console.log(`Simulator server running on port: ${PORT}`);
    }).on("upgrade", (request, socket, head) => {
      const { headers: { origin }, url } = request;
      if (origin === WEB_DOMAIN && url === `/ws/simulator/${STATION_IDENTITY}`) {
        wss.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });
  } catch (error) {
    console.log(error);
  }
};
main();
