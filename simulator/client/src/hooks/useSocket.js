import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import ms from "ms";

const useSocket = (url) => {
  const socket = useWebSocket(url, {
    shouldReconnect: ({ code }) => code === 1005 || code === 1006,
    filter: ({ data }) => data !== "pong",
    share: true,
  });
  const { sendMessage } = socket;

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendMessage("ping");
    }, ms("30s"));
    return () => clearInterval(heartbeatInterval);
  }, [sendMessage]);

  return socket;
};

export default useSocket;
