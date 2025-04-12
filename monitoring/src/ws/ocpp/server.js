import axios, { isAxiosError } from "axios";
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

const server = new RPCServer({
  protocols: ["ocpp2.0.1"],
  strictMode: true,
});

server.stationIdToCLient = new Map();

server.auth(async (accept, reject, { identity }) => {
  try {
    console.log(`Connection request from station: ${identity}`);
    const [_, { data }] = await Promise.all([
      axios.get(`${STATION_API_ENDPOINT}/${identity}`),
      axios.get(`${STATION_API_ENDPOINT}/${identity}/evses`),
    ]);
    if (data.length === 0) {
      const message = `Evses from station ${identity} not found`;
      throw { code: 404, message };
    }
    accept({
      sessionId: uuid(),
      ready: false,
      waitTime: 1,
      evses: data,
      idTokenToTransactionId: new Map(),
      evseIdToTransactionId: new Map(),
    });
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      return reject(status, data.message);
    } else if (error.code) {
      return reject(error.code, error.message);
    }
    console.log({ name: "ClientAuth", error });
    reject(400, "An unknown error occurred");
  }
});

server.on("client", async (client) => {
  try {
    console.log(`Connected with station: ${client.identity}`);

    const watchRequestTransactionEvent = async () => {
      server.changeStream?.close();
      const resumeAfter = server.resumeToken;
      server.changeStream = await StationEvent.watchEvent({
        source: StationEvent.Sources.Central,
        event: [
          "RequestStartTransaction",
          "RequestStopTransaction",
        ],
      }, { resumeAfter });
      server.changeStream.on("change", async ({ _id, fullDocument }) => {
        server.resumeToken = _id;
        const { stationId, event, payload } = fullDocument;
        const client = server.stationIdToCLient.get(stationId.toString());
        const properties = { client, params: payload };
        const isConnected = client?.state === WebSocket.OPEN;
        if (isConnected && event === "RequestStartTransaction") {
          return await remoteControl.requestStartTransactionRequest(properties);
        }
        if (isConnected && event === "RequestStopTransaction") {
          return await remoteControl.requestStopTransactionRequest(properties);
        }
      });
      server.changeStream.on("error", (error) => {
        console.log({ name: "WatchRequestTransactionEvent", error });
        watchRequestTransactionEvent();
      });
    };

    const initialize = async () => {
      server.stationIdToCLient.set(client.identity, client);
      const { session } = client;
      if (!server.changeStream) {
        await watchRequestTransactionEvent();
      }
      session.ready = true;
      session.waitTime = 1;
    };
    initialize();

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
        for (const evse of client.session.evses) {
          for (const index of evse.connector_type.split(" ").keys()) {
            requests.push(
              StationStatus.upsertStatus({
                stationId: evse.station_id,
                evseId: evse.evse_id,
                connectorId: index + 1,
                status: StationStatus.Status.Unavailable,
                rdbId: evse.id,
                siteId: evse.site_id,
                ownerId: evse.owner_id,
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
              connectorStatus: StationStatus.Status.Unavailable,
              timestamp: new Date().toISOString(),
            },
          })
        );
        await Promise.all(requests);
        server.stationIdToCLient.delete(client.identity);
        if (server.stationIdToCLient.size === 0) {
          server.changeStream?.close();
          delete server.changeStream;
        }
        console.log(`Disconnected with station: ${client.identity}`);
      } catch (error) {
        error = isAxiosError(error) ? error.response : error;
        console.log({ name: "ClientClose", error });
      }
    });
  } catch (error) {
    if (!error.code) {
      console.log({ name: "ClientConnect", error });
      error.message = "An unknown error occurred";
    }
    client.close({ code: 1000, reason: error.message });
  }
});

export default server;
