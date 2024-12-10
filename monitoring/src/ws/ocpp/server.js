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

    const changeStream = await StationEvent.watchEvent({
      stationId: parseInt(client.identity),
      source: StationEvent.Sources.Central,
      event: [
        "RequestStartTransaction",
        "RequestStopTransaction",
      ],
    })
    changeStream.on("change", async ({ fullDocument }) => {
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

    client.handle(async (properties) => {
      const { method, params } = properties;
      await StationEvent.addEvent({
        stationId: client.identity,
        source: StationEvent.Sources.Station,
        event: method,
        payload: params,
      });

      properties = { client, ...properties };
      switch (method) {
        case "BootNotification":
          return await provisioning.bootNotificationResponse(properties);

        case "Heartbeat":
          return await availability.heartbeatResponse(properties);

        case "StatusNotification":
          return await availability.statusNotificationResponse(properties);

        case "Authorize":
          return await authorization.authorizeResponse(properties);

        case "TransactionEvent":
          return await transactions.transactionEventResponse(properties);

        default:
          console.log(`${method} from ${client.identity}:`, params);
          throw createRPCError("NotImplemented");
      }
    });

    client.on("close", async () => {
      try {
        const requests = [];
        const [
          { data: station },
          { data: evses },
        ] = await Promise.all([
          axios.get(`${STATION_API_ENDPOINT}/${client.identity}`),
          axios.get(`${STATION_API_ENDPOINT}/${client.identity}/evses`),
        ]);
        if (evses.length === 0) {
          const message = `Evses from station ${client.identity} not found`;
          throw { code: 404, message };
        }
        for (const evse of evses) {
          for (const index of evse.connector_type.split(" ").keys()) {
            requests.push(
              StationStatus.addStationStatus({
                stationId: client.identity,
                evseId: evse.evse_id,
                connectorId: index + 1,
                status: StationStatus.Status.Unavailable,
                site_id: station.site_id,
                owner_id: station.owner_id,
                latitude: station.latitude,
                longitude: station.longitude,
                created_at: station.created_at,
              })
            );
          }
        }
        requests.push(
          StationEvent.addEvent({
            stationId: client.identity,
            source: StationEvent.Sources.Central,
            event: "StatusNotification",
            payload: {
              connectorStatus: StationStatus.Status.Unavailable,
              timestamp: new Date().toISOString(),
            },
          })
        );
        await Promise.all(requests);
        changeStream.close();
        clients.delete(client.identity);
        console.log(`Disconnected with station: ${client.identity}`);
      } catch (error) {
        console.log(error);
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
