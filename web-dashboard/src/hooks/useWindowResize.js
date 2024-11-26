import { useEffect } from "react";

const useWindowResize = (callback) => {
  useEffect(() => {
    callback();
    window.addEventListener("load", callback);
    window.addEventListener("resize", callback);
    return () => {
      window.removeEventListener("load", callback);
      window.removeEventListener("resize", callback);
    };
  }, [callback]);
};

export default useWindowResize;
