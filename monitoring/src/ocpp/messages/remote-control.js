import { idTokens } from "../server.js";
import { v4 as uuid } from "uuid";

const transactions = new Map();

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async ({ client }) => {
  const idToken = uuid();
  idTokens.set(idToken, "");
  const { status } = await client.call("RequestStartTransaction", {
    remoteStartId: 0,
    idToken: {
      idToken: idToken,
      type: "Central",
    },
  });
  if (status === "Accepted") {
    transactions.set(client.identity, idToken);
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async ({ client }) => {
  const idToken = remoteControl.transactions.get(client.identity);
  const { status } = await client.call("RequestStopTransaction", {
    transactionId: idTokens.get(idToken),
  });
  if (status === "Accepted") {
    transactions.delete(client.identity);
  }
  return { status };
};

export default remoteControl;
