import { Monitoring } from "../../../repository/monitoring.js";
import { User } from "../../../repository/user.js";
import { idTokenToTransactionId } from "../server.js";

const authorizeWithRFID = async ({ idToken }) => {
  const response = { idTokenInfo: { status: "Unknown" } };
  if (await User.getByRFID(idToken)) {
    idTokenToTransactionId.set(idToken, "");
    response.idTokenInfo.status = "Accepted";
  }
  return response;
};

const authorization = {};

authorization.authorizeResponse = async ({ client, method, params }) => {
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  const { idToken, type } = params.idToken;
  if (type === "ISO15693") {
    return await authorizeWithRFID({ idToken });
  }
  return { idTokenInfo: { status: "Unknown" } };
};

export default authorization;
