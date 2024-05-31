import cryptoJs from "crypto-js";
import { v4 as uuid } from "uuid";

import Monitoring from "../../../repository/monitoring.js";
import { clients } from "../server.js";

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async ({ client, params }) => {
  const { evseId } = params;
  const idToken = {
    idToken: uuid(),
    type: "Central",
  };
  const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
  const { idTokenToTransactionId } = clients.get(client.identity);
  idTokenToTransactionId.set(hashedIdToken, "");
  const method = "RequestStartTransaction";
  const response = await client.call(method, {
    evseId,
    remoteStartId: Math.floor(1000 + Math.random() * 9000),
    idToken,
  });
  await Monitoring.addEvent({
    stationId: client.identity,
    source: Monitoring.Sources.Station,
    event: method,
    payload: response,
  });
  const { status } = response;
  if (status !== "Accepted") {
    idTokenToTransactionId.delete(hashedIdToken);
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async ({ client, params }) => {
  const { evseId } = params;
  const { evseIdToTransactionId } = clients.get(client.identity);
  const transactionId = evseIdToTransactionId.get(evseId) || "";
  const method = "RequestStopTransaction";
  const response = await client.call(method, { transactionId });
  await Monitoring.addEvent({
    stationId: client.identity,
    source: Monitoring.Sources.Station,
    event: method,
    payload: response,
  });
  const { status } = response;
  return { status };
};

export default remoteControl;
