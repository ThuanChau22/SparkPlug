import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useViewParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = useMemo(() => {
    return searchParams.get("view") || "";
  }, [searchParams]);
  const setView = useCallback((view = "") => {
    setSearchParams((searchParams) => {
      if (view) {
        searchParams.set("view", view);
      } else {
        searchParams.delete("view");
      }
      return searchParams;
    });
  }, [setSearchParams]);
  return [view, setView];
};

export default useViewParam;
