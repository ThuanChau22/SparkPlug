import cryptoJs from "crypto-js";
import { v4 as uuid } from "uuid";

import Monitoring from "../../../repository/monitoring.js";
import { clients } from "../server.js";

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async (client, { evseId }) => {
  const idToken = {
    idToken: uuid(),
    type: "Central",
  };
  const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
  const { idTokenToTransactionId } = clients.get(client.identity);
  idTokenToTransactionId.set(hashedIdToken, "");
  const method = "RequestStartTransaction";
  const responsePayload = await client.call(method, {
    evseId,
    remoteStartId: Math.floor(1000 + Math.random() * 9000),
    idToken,
  });
  await Monitoring.addEvent({
    stationId: client.identity,
    event: method,
    payload: responsePayload,
  });
  const { status } = responsePayload;
  if (status !== "Accepted") {
    idTokenToTransactionId.delete(hashedIdToken);
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async (client, { transactionId }) => {
  const method = "RequestStopTransaction";
  const responsePayload = await client.call(method, {
    transactionId: transactionId || "",
  });
  await Monitoring.addEvent({
    stationId: client.identity,
    event: method,
    payload: responsePayload,
  });
  const { status } = responsePayload;
  return { status };
};

export default remoteControl;
