import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const useMapParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  return useMemo(() => {
    const current = {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      zoom: searchParams.get("z"),
    };
    const currentValues = Object.values(current);
    const filter = (e) => e === null;
    const exist = currentValues.filter(filter).length === 0;
    const setMapParams = ({ lat, lng, zoom }) => {
      if (currentValues.join() !== `${lat},${lng},${zoom}`) {
        setSearchParams((s) => ({ ...s, lat, lng, z: zoom }));
      }
    };
    return [{ ...current, exist }, setMapParams];
  }, [searchParams, setSearchParams]);
};

export default useMapParams;
