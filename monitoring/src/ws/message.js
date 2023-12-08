import remoteControl from "../ocpp/messages/remote-control.js";
import { clients } from "../ocpp/server.js";
import { sendJsonMessage } from "./server.js";

export const Action = {
  MONITORING: "Monitoring",
  REMOTE_START: "RemoteStart",
  REMOTE_STOP: "RemoteStop",
};

export const handleMonitoring = async (payload) => {
  const { stationId, event, content } = payload;
  sendJsonMessage({
    action: Action.MONITORING,
    payload: { stationId, event, content },
  });
};

export const handleRemoteStart = async (payload) => {
  const client = clients.get(payload.identity);
  sendJsonMessage({
    action: Action.REMOTE_START,
    payload: await remoteControl.requestStartTransactionRequest({ client }),
  });
};

export const handleRemoteStop = async (payload) => {
  const client = clients.get(payload.identity);
  sendJsonMessage({
    action: Action.REMOTE_STOP,
    payload: await remoteControl.requestStopTransactionRequest({ client }),
  });
};
