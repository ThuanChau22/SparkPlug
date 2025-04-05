import axios from "axios";
import { RPCServer, createRPCError } from "ocpp-rpc";
import { v4 as uuid } from "uuid";
import WebSocket from "ws";

import { STATION_API_ENDPOINT } from "../../config.js";
import StationEvent from "../../repositories/station-event.js";
import StationStatus from "../../repositories/station-status.js";
import authorization from "./handlers/authorization.js";
import availability from "./handlers/availability.js";
import provisioning from "./handlers/provisioning.js";
import remoteControl from "./handlers/remote-control.js";
import transactions from "./handlers/transactions.js";

/**
 * @typedef {Object} Client
 * @property {RPCServerClient} station
 * @property {Map.<string, string>} idTokenToTransactionId
 * @property {Map.<number, string>} evseIdToTransactionId
 * @property {ChangeStream} changeStream
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
      changeStream: null,
    });

    let resumeAfter;
    const watchRequestTransactionEvent = async () => {
      clients.get(client.identity).changeStream?.close();
      const changeStream = await StationEvent.watchEvent(
        {
          stationId: parseInt(client.identity),
          source: StationEvent.Sources.Central,
          event: [
            "RequestStartTransaction",
            "RequestStopTransaction",
          ],
        },
        { resumeAfter },
      )
      changeStream.on("change", async ({ _id, fullDocument }) => {
        resumeAfter = _id;
        const { event, payload } = fullDocument;
        const properties = { client, params: payload };
        const isConnected = client.state === WebSocket.OPEN;
        if (isConnected && event === "RequestStartTransaction") {
          return await remoteControl.requestStartTransactionRequest(properties);
        }
        if (isConnected && event === "RequestStopTransaction") {
          return await remoteControl.requestStopTransactionRequest(properties);
        }
      });
      changeStream.on("error", (error) => {
        console.log({ name: "WatchRequestTransactionEvent", error });
        watchRequestTransactionEvent();
      });
      clients.get(client.identity).changeStream = changeStream;
    };
    await watchRequestTransactionEvent();

    client.handle(async (properties) => {
      try {
        const { method, params } = properties;
        properties = { client, ...properties };
        const requests = [];
        if (method === "BootNotification") {
          requests.push(provisioning.bootNotificationResponse(properties));
        } else if (method === "Heartbeat") {
          requests.push(availability.heartbeatResponse(properties));
        } else if (method === "StatusNotification") {
          requests.push(availability.statusNotificationResponse(properties));
        } else if (method === "Authorize") {
          requests.push(authorization.authorizeResponse(properties));
        } else if (method === "TransactionEvent") {
          requests.push(transactions.transactionEventResponse(properties));
        } else {
          console.log(`${method} from ${client.identity}:`, params);
          throw createRPCError("NotImplemented");
        }
        requests.push(
          StationEvent.addEvent({
            stationId: parseInt(client.identity),
            source: StationEvent.Sources.Station,
            event: method,
            payload: params,
          })
        );
        const [response] = await Promise.all(requests);
        return response;
      } catch (error) {
        console.log({ name: "ClientHandle", error });
        throw error;
      }
    });

    client.on("close", async () => {
      try {
        const requests = [];
        const { data } = await axios.get(`${STATION_API_ENDPOINT}/${client.identity}/evses`);
        if (data.length === 0) {
          const message = `Evses from station ${client.identity} not found`;
          throw { code: 404, message };
        }
        const { Unavailable } = StationStatus.Status;
        for (const evse of data) {
          for (const index of evse.connector_type.split(" ").keys()) {
            requests.push(
              StationStatus.upsertStatus({
                stationId: evse.station_id,
                evseId: evse.evse_id,
                connectorId: index + 1,
                status: Unavailable,
                latitude: evse.latitude,
                longitude: evse.longitude,
                createdAt: evse.created_at,
              })
            );
          }
        }
        requests.push(
          StationEvent.addEvent({
            stationId: parseInt(client.identity),
            source: StationEvent.Sources.Central,
            event: "StatusNotification",
            payload: {
              connectorStatus: Unavailable,
              timestamp: new Date().toISOString(),
            },
          })
        );
        await Promise.all(requests);
        clients.get(client.identity).changeStream?.close();
        clients.delete(client.identity);
        console.log(`Disconnected with station: ${client.identity}`);
      } catch (error) {
        console.log({ name: "ClientClose", error });
      }
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
