import { v4 as uuid } from "uuid";

import {
  clientIdToIdToken,
  idTokenToTransactionId,
} from "../server.js";

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async ({ client }) => {
  const idToken = uuid();
  const { status } = await client.call("RequestStartTransaction", {
    remoteStartId: 0,
    idToken: {
      idToken: idToken,
      type: "Central",
    },
  });
  if (status === "Accepted") {
    idTokenToTransactionId.set(idToken, "");
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async ({ client }) => {
  const idToken = clientIdToIdToken.get(client.identity);
  const { status } = await client.call("RequestStopTransaction", {
    transactionId: idTokenToTransactionId.get(idToken),
  });
  return { status };
};

export default remoteControl;
