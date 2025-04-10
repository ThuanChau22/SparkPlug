import { useCallback, useEffect, useRef } from "react";
import ms from "ms";

const useBatchUpdate = ({ callback, delay = ms("5s") } = {}) => {
  const updateTimeoutRef = useRef({});
  const updatesRef = useRef([]);

  const setUpdateTimeout = useCallback(() => {
    clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      for (const payload of updatesRef.current) {
        if (callback) {
          callback(payload);
        }
      }
      setUpdateTimeout();
      updatesRef.current = [];
    }, delay);
  }, [callback, delay]);

  useEffect(() => () => clearTimeout(updateTimeoutRef.current), []);

  return [updatesRef, setUpdateTimeout]
};

export default useBatchUpdate;
