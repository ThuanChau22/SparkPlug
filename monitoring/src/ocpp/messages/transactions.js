import { Monitoring } from "../../db/model.js";
import { idTokens } from "../server.js";

const transactionStart = ({ idToken, transactionInfo }) => {
  const response = { idTokenInfo: { status: "Unknown" } };
  if (idTokens.has(idToken?.idToken)) {
    if (idTokens.get(idToken.idToken) !== "") {
      response.idTokenInfo.status = "ConcurrentTx";
      return response;
    }
    const { transactionId } = transactionInfo;
    idTokens.set(idToken.idToken, transactionId);
    response.idTokenInfo.status = "Accepted";
    return response;
  }
  return response;
};

const transactionStop = ({ idToken, transactionInfo }) => {
  const response = { idTokenInfo: { status: "Unknown" } };
  const { transactionId } = transactionInfo;
  if (idTokens.get(idToken?.idToken) === transactionId) {
    idTokens.delete(idToken.idToken);
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
    return transactionStart(params);
  }
  if (eventType === "Ended") {
    return transactionStop(params);
  }
  return {};
};

export default transactions;
