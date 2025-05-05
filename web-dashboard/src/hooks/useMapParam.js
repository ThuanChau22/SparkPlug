import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useMapParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapParam = useMemo(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const zoom = searchParams.get("z");
    return [lat, lng, zoom].filter((e) => e).join();
  }, [searchParams]);
  const setMapParam = useCallback((map = "") => {
    setSearchParams((searchParams) => {
      const current = Object.values({
        lat: searchParams.get("lat"),
        lng: searchParams.get("lng"),
        zoom: searchParams.get("z"),
      }).filter((e) => e).join();
      if (map !== current) {
        const [lat, lng, zoom] = map.split(",");
        if (lat && lng && zoom) {
          searchParams.set("lat", lat);
          searchParams.set("lng", lng);
          searchParams.set("z", zoom);
        } else {
          searchParams.delete("lat");
          searchParams.delete("lng");
          searchParams.delete("z");
        }
      }
      return searchParams;
    });
  }, [setSearchParams]);
  return [mapParam, setMapParam];
};

export default useMapParam;
