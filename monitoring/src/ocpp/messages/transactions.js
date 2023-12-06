import { idTokens } from "../server.js";
import remoteControl from "./remote-control.js";
import { handleMeterValue } from "../../ws/message.js"

const transactions = {};

transactions.transactionEventResponse = ({ client, params }) => {
  console.log(`TransactionEvent from ${client.identity}:`, params);
  const response = {};
  const { eventType, idToken, transactionInfo } = params;
  if (eventType === "Started" && idTokens.has(idToken?.idToken)) {
    const { transactionId } = transactionInfo;
    idTokens.set(idToken.idToken, transactionId);
    response.idTokenInfo = {
      status: "Accepted",
    };
  }
  if (eventType === "Ended" && idTokens.has(idToken?.idToken)) {
    idTokens.delete(idToken.idToken);
    if (remoteControl.idToken === idToken.idToken) {
      delete remoteControl.idToken;
    }
    response.idTokenInfo = {
      status: "Accepted",
    };
  }
  handleMeterValue(params);
  return response;
};

export default transactions;
