import cryptoJs from "crypto-js";

import Monitoring from "../../../repository/monitoring.js";
import User from "../../../repository/user.js";
import { clients } from "../server.js";

const authorizeWithRFID = async (client, idToken) => {
  const response = { idTokenInfo: { status: "Invalid" } };
  if (await User.getByRFID(idToken.idToken)) {
    const { idTokenToTransactionId } = clients.get(client.identity);
    const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
    if (idTokenToTransactionId.has(hashedIdToken)) {
      idTokenToTransactionId.delete(hashedIdToken);
    } else {
      idTokenToTransactionId.set(hashedIdToken, "");
    }
    response.idTokenInfo.status = "Accepted";
  }
  return response;
};

const authorization = {};

authorization.authorizeResponse = async (client, { method, params }) => {
  await Monitoring.addEvent({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  const { idToken } = params;
  if (idToken.type === "ISO15693") {
    return await authorizeWithRFID(client, idToken);
  }
  return { idTokenInfo: { status: "Unknown" } };
};

export default authorization;
