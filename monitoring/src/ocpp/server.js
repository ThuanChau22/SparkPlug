import { RPCServer, createRPCError } from "ocpp-rpc";
import { v4 as uuid } from 'uuid';

import authorization from "./messages/authorization.js";
import availability from "./messages/availability.js";
import provisioning from "./messages/provisioning.js";
import transactions from "./messages/transactions.js";

export const clients = new Map();
export const idTokens = new Map();

const server = new RPCServer({
  protocols: ["ocpp2.0.1"],
  strictMode: true,
});

server.auth((accept, reject, handshake) => {
  console.log(`ConnectionRequest from ${handshake.identity}`);
  if (handshake.identity) {
    accept({ sessionId: uuid() });
  } else {
    reject(401);
  }
});

server.on("client", async (client) => {

  clients.set(client.identity, client);

  client.handle("BootNotification", (params) => {
    return provisioning.bootNotificationResponse({ ...params, client });
  });

  client.handle("Heartbeat", (params) => {
    return availability.heartbeatResponse({ ...params, client });
  });

  client.handle("StatusNotification", (params) => {
    return availability.statusNotificationResponse({ ...params, client });
  });

  client.handle("Authorize", (params) => {
    return authorization.authorizeResponse({ ...params, client });
  });

  client.handle("TransactionEvent", (params) => {
    return transactions.transactionEventResponse({ ...params, client });
  });

  client.on("close", () => {
    clients.delete(client.identity);
  });

  // create a wildcard handler to handle any RPC method
  client.handle(({ method, params }) => {
    // This handler will be called if the incoming method cannot be handled elsewhere.
    console.log(`${method} from ${client.identity}:`, params);

    // throw an RPC error to inform the server that we don"t understand the request.
    throw createRPCError("NotImplemented");
  });
});

export default server;
