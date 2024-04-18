import cryptoJs from "crypto-js";

import Monitoring from "../../../repository/monitoring.js";
import { clients } from "../server.js";

const transactionStart = (client, params) => {
  const { transactionInfo: { transactionId }, idToken, evse } = params;
  const response = { idTokenInfo: { status: "Unknown" } };
  const {
    idTokenToTransactionId,
    evseIdToTransactionId,
  } = clients.get(client.identity);

  const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
  if (idTokenToTransactionId.has(hashedIdToken)) {
    if (idTokenToTransactionId.get(hashedIdToken) !== "") {
      response.idTokenInfo.status = "ConcurrentTx";
      return response;
    }
    idTokenToTransactionId.set(hashedIdToken, transactionId);
    if (evse) {
      evseIdToTransactionId.set(evse.id, transactionId);
    }
    response.idTokenInfo.status = "Accepted";
    return response;
  }
  return response;
};

const transactionStop = (client, params) => {
  const { transactionInfo: { transactionId }, idToken, evse } = params;
  const response = { idTokenInfo: { status: "Unknown" } };

  const {
    idTokenToTransactionId,
    evseIdToTransactionId,
  } = clients.get(client.identity);

  const hashedIdToken = cryptoJs.SHA256(JSON.stringify(idToken)).toString();
  if (idTokenToTransactionId.get(hashedIdToken) === transactionId) {
    idTokenToTransactionId.delete(hashedIdToken);
    if (evse) {
      evseIdToTransactionId.delete(evse.id);
    }
    response.idTokenInfo.status = "Accepted";
    return response;
  }
  return response;
};

const transactions = {};

transactions.transactionEventResponse = async (client, { method, params }) => {
  await Monitoring.addEvent({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  const { eventType } = params;
  if (eventType === "Started") {
    return transactionStart(client, params);
  }
  if (eventType === "Ended") {
    return transactionStop(client, params);
  }
  return {};
};

export default transactions;
