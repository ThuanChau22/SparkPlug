import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import LocationFilter from "components/LocationFilter";
import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import SiteMarkerCluster from "components/Map/SiteMarkerCluster";
import StickyContainer from "components/StickyContainer";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  siteGetList,
  siteSetStateSelected,
  siteSetCitySelected,
  siteSetZipCodeSelected,
  selectSiteList,
  selectSelectedState,
  selectStateOptions,
  selectSelectedCity,
  selectCityOptions,
  selectSelectedZipCode,
  selectZipCodeOptions,
} from "redux/site/siteSlice";

const SiteMapView = ({ handleViewSite }) => {
  const filterRef = useRef({});

  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (siteList.length === 0) {
      setLoading(true);
      await dispatch(siteGetList()).unwrap();
      setLoading(false);
    }
  }, [siteList.length, dispatch]);

  useEffect(() => {
    fetchData()
  }, [fetchData]);

  const mapRefHeight = useMemo(() => {
    const filterHeight = filterRef.current?.offsetHeight;
    return headerHeight + filterHeight;
  }, [headerHeight, filterRef]);

  const handleFilter = (state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip_code=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(siteGetList(query));
    dispatch(siteSetStateSelected(state));
    dispatch(siteSetCitySelected(city));
    dispatch(siteSetZipCodeSelected(zipCode));
  };

  return (
    <StickyContainer style={{ top: `${headerHeight}px` }}>
      <StickyContainer style={{ top: `${headerHeight}px` }}>
        <LocationFilter
          ref={filterRef}
          selectedState={siteSelectedState}
          states={siteStateOptions}
          selectedCity={siteSelectedCity}
          cities={siteCityOptions}
          selectedZipCode={siteSelectedZipCode}
          zipCodes={siteZipCodeOptions}
          onChange={handleFilter}
        />
      </StickyContainer>
      <MapContainer
        loading={loading}
        refHeight={mapRefHeight}
      >
        <MapFitBound positions={siteList} />
        <SiteMarkerCluster
          siteList={siteList}
          onClick={handleViewSite}
        />
      </MapContainer>
    </StickyContainer>
  );
};

export default SiteMapView;
