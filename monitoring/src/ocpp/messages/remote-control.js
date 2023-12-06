import { idTokens } from "../server.js";
import { v4 as uuid } from "uuid";

const remoteControl = {};

remoteControl.requestStartTransactionRequest = async ({ client }) => {
  console.log(`RequestStartTransaction to ${client.identity}`);
  const idToken = uuid();
  idTokens.set(idToken, "");
  const { status } = await client.call("RequestStartTransaction", {
    remoteStartId: 1234,
    idToken: {
      idToken: idToken,
      type: "Central",
    },
  });
  if (status === "Accepted") {
    remoteControl.idToken = idToken;
  }
  return { status };
};

remoteControl.requestStopTransactionRequest = async ({ client }) => {
  console.log(`RequestStopTransaction to ${client.identity}`);
  return await client.call("RequestStopTransaction", {
    transactionId: idTokens.get(remoteControl.idToken),
  });
};

export default remoteControl;
