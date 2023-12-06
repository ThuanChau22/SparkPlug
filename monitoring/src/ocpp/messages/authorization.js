import { idTokens } from "../server.js";
import { getUserByRFID } from "../../repository.js";

const authorization = {};

authorization.authorizeResponse = async ({ client, params }) => {
  console.log(`Authorization from ${client.identity}:`, params);
  const { idToken, type } = params.idToken;
  if (type === "ISO15693" && await getUserByRFID(idToken)) {
    idTokens.set(idToken, "");
    return {
      idTokenInfo: {
        status: "Accepted",
      }
    };
  }
  return {
    idTokenInfo: {
      status: "Unknown",
    }
  };
};

export default authorization;
