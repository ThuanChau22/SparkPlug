import cryptoJs from "crypto-js";

const transactionStart = (client, params) => {
  const { idTokenToTransactionId, evseIdToTransactionId } = client.session;
  const { transactionInfo: { transactionId }, idToken, evse } = params;
  const response = { idTokenInfo: { status: "Unknown" } };
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
  const { idTokenToTransactionId, evseIdToTransactionId } = client.session;
  const { transactionInfo: { transactionId }, idToken, evse } = params;
  const response = { idTokenInfo: { status: "Unknown" } };
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

transactions.transactionEventResponse = async ({ client, params }) => {
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
