import { RPCServer, createRPCError } from "ocpp-rpc";
import { v4 as uuid } from "uuid";

import authorization from "./handlers/authorization.js";
import availability from "./handlers/availability.js";
import provisioning from "./handlers/provisioning.js";
import transactions from "./handlers/transactions.js";

/**
 * @typedef {Object} Client
 * @property {RPCServerClient} station
 * @property {Map.<string, string>} idTokenToTransactionId
 * @property {Map.<number, string>} evseIdToTransactionId
 */
/**
 * @type {Map.<string, Client>}
 */
export const clients = new Map();

const server = new RPCServer({
  protocols: ["ocpp2.0.1"],
  strictMode: true,
});

server.auth((accept, reject, handshake) => {
  console.log(`Connection request from station: ${handshake.identity}`);
  if (handshake.identity) {
    accept({ sessionId: uuid() });
  } else {
    reject(401);
  }
});

server.on("client", async (client) => {
  try {
    console.log(`Connected with station: ${client.identity}`);

    clients.set(client.identity, {
      station: client,
      idTokenToTransactionId: new Map(),
      evseIdToTransactionId: new Map(),
    });

    client.handle("BootNotification", (message) => {
      return provisioning.bootNotificationResponse(client, message);
    });

    client.handle("Heartbeat", (message) => {
      return availability.heartbeatResponse(client, message);
    });

    client.handle("StatusNotification", (message) => {
      return availability.statusNotificationResponse(client, message);
    });

    client.handle("Authorize", (message) => {
      return authorization.authorizeResponse(client, message);
    });

    client.handle("TransactionEvent", (message) => {
      return transactions.transactionEventResponse(client, message);
    });

    client.on("close", async () => {
      await availability.statusNotificationResponse(client, {
        method: "StatusNotification",
        params: {
          connectorStatus: "Unavailable",
          timestamp: new Date().toISOString(),
        }
      });
      clients.delete(client.identity);
      console.log(`Disconnected with station: ${client.identity}`);
    });

    // create a wildcard handler to handle any RPC method
    client.handle(({ method, params }) => {
      // This handler will be called if the incoming method cannot be handled elsewhere.
      console.log(`${method} from ${client.identity}:`, params);

      // throw an RPC error to inform the server that we don"t understand the request.
      throw createRPCError("NotImplemented");
    });
  } catch (error) {
    if (!error.code) {
      console.log(error);
      error.message = "An unknown error occurred";
    }
    server.close(1000, error.message);
  }
});

export default server;
