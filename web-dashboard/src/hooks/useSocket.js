import { useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import ms from "ms";

const useSocket = (url, options = {}) => {
  const isUnmount = useRef(false);

  const socket = useWebSocket(url, {
    shouldReconnect: ({ code }) => {
      if (isUnmount.current) return false;
      return code === 1005 || code === 1006;
    },
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

  useEffect(() => () => isUnmount.current = true, []);

  return socket;
};

export default useSocket;
