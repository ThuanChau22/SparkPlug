import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());
export const {
  PORT,
  WEB_DOMAIN,
  STATION_MANAGEMENT_WS_ENDPOINT,
  STATION_IDENTITY,
  STATION_PASSWORD,
  STATION_CONFIGURATION,
} = process.env;
