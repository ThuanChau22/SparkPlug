import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useSearchParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = useMemo(() => {
    return searchParams.get("search") || "";
  }, [searchParams]);
  const setSearchParam = useCallback((search = "") => {
    setSearchParams((searchParams) => {
      if (search) {
        searchParams.set("search", search);
      } else {
        searchParams.delete("search");
      }
      return searchParams;
    });
  }, [setSearchParams]);
  return [searchParam, setSearchParam];
};

export default useSearchParam;
