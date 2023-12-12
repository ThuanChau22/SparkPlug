import { Monitoring } from "../../db/model.js";
import {
  clientIdToIdToken,
  idTokenToTransactionId,
} from "../server.js";

const transactionStart = ({ client, params }) => {
  const { idToken, transactionInfo } = params;
  const response = { idTokenInfo: { status: "Unknown" } };
  if (idTokenToTransactionId.has(idToken?.idToken)) {
    if (idTokenToTransactionId.get(idToken.idToken) !== "") {
      response.idTokenInfo.status = "ConcurrentTx";
      return response;
    }
    const { transactionId } = transactionInfo;
    clientIdToIdToken.set(client.identity, idToken.idToken);
    idTokenToTransactionId.set(idToken.idToken, transactionId);
    response.idTokenInfo.status = "Accepted";
    return response;
  }
  return response;
};

const transactionStop = ({ client, params }) => {
  const { idToken, transactionInfo } = params;
  const response = { idTokenInfo: { status: "Unknown" } };
  const { transactionId } = transactionInfo;
  if (idTokenToTransactionId.get(idToken?.idToken) === transactionId) {
    clientIdToIdToken.delete(client.identity);
    idTokenToTransactionId.delete(idToken.idToken);
    response.idTokenInfo.status = "Accepted";
    return response;
  }
  return response;
};

const transactions = {};

transactions.transactionEventResponse = async ({ client, method, params }) => {
  await Monitoring.add({
    stationId: client.identity,
    event: method,
    payload: params,
  });
  const { eventType } = params;
  if (eventType === "Started") {
    return transactionStart({ client, params });
  }
  if (eventType === "Ended") {
    return transactionStop({ client, params });
  }
  return {};
};

export default transactions;
