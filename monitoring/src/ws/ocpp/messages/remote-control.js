import { v4 as uuid } from "uuid";

import { Monitoring } from "../../../repository/monitoring.js";
import {
  clientIdToIdToken,
  idTokenToTransactionId,
} from "../server.js";

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async ({ client }) => {
  const idToken = uuid();
  idTokenToTransactionId.set(idToken, "");
  const method = "RequestStartTransaction";
  const responsePayload = await client.call(method, {
    remoteStartId: Math.floor(1000 + Math.random() * 9000),
    idToken: {
      idToken: idToken,
      type: "Central",
    },
  });
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: responsePayload,
  });
  const { status } = responsePayload;
  if (status !== "Accepted") {
    idTokenToTransactionId.delete(idToken);
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async ({ client }) => {
  const idToken = clientIdToIdToken.get(client.identity);
  const method = "RequestStopTransaction";
  const responsePayload = await client.call(method, {
    transactionId: idTokenToTransactionId.get(idToken) || "",
  });
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: responsePayload,
  });
  const { status } = responsePayload;
  return { status };
};

export default remoteControl;
