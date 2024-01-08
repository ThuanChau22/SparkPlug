import app from "./app.js";
import { PORT } from "./config.js";

const main = async () => {
  try {
    app.listen(PORT, console.log(`User server running on port: ${PORT}`));
  } catch (error) {
    console.log(error.message);
  }
};
main();
