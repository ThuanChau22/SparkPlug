import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useMapParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapParams = useMemo(() => {
    const params = {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      zoom: searchParams.get("z"),
    };
    const values = Object.values(params);
    const isNull = (v) => v === null;
    const exist = values.filter(isNull).length === 0;
    return { ...params, exist };
  }, [searchParams]);
  const setMapParams = useCallback(({ lat, lng, zoom }) => {
    setSearchParams((searchParams) => {
      const current = Object.values({
        lat: searchParams.get("lat"),
        lng: searchParams.get("lng"),
        zoom: searchParams.get("z"),
      }).join();
      if (current !== `${lat},${lng},${zoom}`) {
        searchParams.set("lat", lat);
        searchParams.set("lng", lng);
        searchParams.set("z", zoom);
      }
      return searchParams;
    });
  }, [setSearchParams]);
  return [mapParams, setMapParams];
};

export default useMapParams;
