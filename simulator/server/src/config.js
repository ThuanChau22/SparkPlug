import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());
export const {
  PORT,
  WEB_DOMAIN,
  CSMS_WS_ENDPOINT,
  EVSE_API_ENDPOINT,
} = process.env;
