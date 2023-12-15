import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import "leaflet/dist/leaflet.css";

import { siteIcon } from "assets/mapIcons";
import LocationFilter from "components/LocationFilter";
import SiteAnalyticsModal from "components/SiteAnalyticsModal";
import MapContainer from "components/MapContainer";
import SiteMarker from "components/SiteMarker";
import {
  siteGetAll,
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
} from "redux/site/siteSlide";

const SiteAnalytics = () => {
  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siteList.length === 0) {
      dispatch(siteGetAll());
    }
  }, [siteList, dispatch]);

  const handleFilter = (state, city, zipCode) => {
    const params = [];
    if (state !== "All") params.push(`state=${state}`);
    if (city !== "All") params.push(`city=${city}`);
    if (zipCode !== "All") params.push(`zip=${zipCode}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    dispatch(siteGetAll(query));
    dispatch(siteSetStateSelected(state));
    dispatch(siteSetCitySelected(city));
    dispatch(siteSetZipCodeSelected(zipCode));
  };

  const handleViewSite = (siteId) => {
    setSelectedSiteId(siteId);
    setIsAnalyticsModalOpen(true);
  };

  const displayMap = useMemo(() => {
    const renderSiteMarker = (site) => (
      <SiteMarker
        key={site.id}
        site={site}
        icon={siteIcon}
        onSiteClick={handleViewSite}
      />
    );
    return (
      <MapContainer
        locations={siteList}
        renderMarker={renderSiteMarker}
      />
    );
  }, [siteList]);

  return (
    <CCard>
      <LocationFilter
        selectedState={siteSelectedState}
        states={siteStateOptions}
        selectedCity={siteSelectedCity}
        cities={siteCityOptions}
        selectedZipCode={siteSelectedZipCode}
        zipCodes={siteZipCodeOptions}
        onChange={handleFilter}
      />
      {displayMap}
      <CCardBody>
        <CCardTitle>
          Sites List
        </CCardTitle>
        <CListGroup>
          {siteList.map(({ id, name }) => (
            <CListGroupItem
              key={id}
              className="list-item d-flex justify-content-between align-items-center py-3"
              onClick={() => handleViewSite(id)}
            >
              <div>ID: {id}</div>
              <div>{name}</div>
              <div></div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      {isAnalyticsModalOpen && (
        <SiteAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          siteId={selectedSiteId}
        />
      )}
    </CCard>
  );
};

export default SiteAnalytics;
