import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import ms from "ms";

const useSocket = (url, options= {}) => {
  const socket = useWebSocket(url, {
    shouldReconnect: ({ code }) => code === 1005 || code === 1006,
    filter: ({ data }) => data !== "pong",
    share: true,
    ...options,
  });
  const { sendMessage } = socket;

  // Handle Heartbeat
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendMessage("ping");
    }, ms("30s"));
    return () => clearInterval(heartbeatInterval);
  }, [sendMessage]);

  return socket;
};

export default useSocket;
