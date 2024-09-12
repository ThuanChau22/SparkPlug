import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import LoadingIndicator from "components/LoadingIndicator";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import SiteMarker from "components/SiteMarker";
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

  const [mapHeight, setMapHeight] = useState(window.innerHeight);

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

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  const positions = useMemo(() => siteList.map((site) => {
    return [site.latitude, site.longitude];
  }), [siteList]);

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
      <div style={{ height: `${mapHeight}px` }}>
        {loading
          ? <LoadingIndicator loading={loading} />
          : (
            <MapContainer positions={positions}>
              {siteList.map((site) => (
                <SiteMarker
                  key={site.id}
                  site={site}
                  onClick={() => handleViewSite(site.id)}
                />
              ))}
            </MapContainer>
          )
        }
      </div>
    </StickyContainer>
  );
};

export default SiteMapView;
