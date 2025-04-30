import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useSearchParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = useMemo(() => {
    return searchParams.get("search");
  }, [searchParams]);
  const setSearch = useCallback((text)=>{
    setSearchParams((searchParams) => {
      if (text) {
        searchParams.set("search", text);
      } else {
        searchParams.delete("search");
      }
      return searchParams;
    });
  },[setSearchParams]);
  return [search, setSearch];
};

export default useSearchParam;
