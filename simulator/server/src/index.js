import apiApp from "./api/app.js";
import wsApp from "./ws/app.js";
import { PORT } from "./config.js";

const main = async () => {
  try {
    apiApp.listen(PORT, () => {
      console.log(`Simulator server running on port: ${PORT}`);
    }).on("upgrade", (request, socket, head) => {
      wsApp.handleUpgrade(request, socket, head);
    });
  } catch (error) {
    console.log(error);
  }
};
main();
