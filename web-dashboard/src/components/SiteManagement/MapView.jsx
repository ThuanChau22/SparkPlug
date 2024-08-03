import { useState, useEffect, createRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { siteIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import SiteMarker from "components/SiteMarker";
import StickyContainer from "components/StickyContainer";
import { selectHeaderHeight } from "redux/header/headerSlice";
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
  const filterRef = createRef();

  const headerHeight = useSelector(selectHeaderHeight);

  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);
  const [setBound, setSetBound] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    if (siteList.length === 0) {
      dispatch(siteGetList());
    }
  }, [siteList.length, dispatch]);

  useEffect(() => {
    const filterHeight = filterRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight));
  }, [headerHeight, filterRef]);

  useEffect(() => {
    setSetBound(true);
  }, [siteList.length]);

  useEffect(() => {
    if (setBound) {
      setSetBound(false);
    }
  }, [setBound]);

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
    <StickyContainer top={`${headerHeight}px`}>
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
      <div style={{ height: `${mapHeight}px` }}>
        <MapContainer
          locations={siteList}
          renderMarker={({ id }) => (
            <SiteMarker
              key={id}
              siteId={id}
              icon={siteIcon}
              onClick={() => handleViewSite(id)}
            />
          )}
          setBound={setBound}
        />
      </div>
    </StickyContainer>
  );
};

export default SiteMapView;
