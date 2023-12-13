import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { siteIcon } from "../assets/mapIcons";
import SiteAnalyticsModal from "../components/SiteAnalyticsModal";
import LocationFilter from "../components/LocationFilter";
import MapContainer from "../components/MapContainer";
import SiteMarker from "../components/SiteMarker";
import "leaflet/dist/leaflet.css";
import {
  siteGetAll,
  selectSiteList,
} from "redux/site/siteSlide";

const SiteAnalytics = () => {
  const siteList = useSelector(selectSiteList);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zipCodes, setZipCodes] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(siteGetAll());
  }, [dispatch]);

  useEffect(() => {
    if (siteList) {
      const uniqueStates = Array.from(new Set(siteList.map(site => site.state))).sort((a, b) => a.localeCompare(b));
      const uniqueCities = Array.from(new Set(siteList.map(site => site.city))).sort((a, b) => a.localeCompare(b));
      const uniqueZips = Array.from(new Set(siteList.map(site => site.zip_code))).sort((a, b) => a.localeCompare(b));
      setStates(["All", ...uniqueStates]);
      setCities(["All", ...uniqueCities]);
      setZipCodes(["All", ...uniqueZips]);
      setFilteredCities(["All", ...uniqueCities]);
    }
  }, [siteList]);

  const applyFilters = (state, city, zip) => {
    let query = "";
    const queryParams = [];
    if (state !== 'All') queryParams.push(`state=${state}`);
    if (city !== 'All') queryParams.push(`city=${city}`);
    if (zip !== 'All') queryParams.push(`zip=${zip}`);
    if (queryParams.length > 0) {
      query += `?${queryParams.join('&')}`;
    }
    dispatch(siteGetAll(query));
  };

  const onFiltersChange = (newState, newCity, newZip) => {
    applyFilters(newState, newCity, newZip);
  };

  const handleSiteClick = (siteId) => {
    setSelectedSite(siteId);
    setIsAnalyticsModalOpen(true);
  };

  const renderSiteMarker = site => (
    <SiteMarker
      key={site.id}
      site={site}
      icon={siteIcon}
      onSiteClick={handleSiteClick}
    />
  );
  return (
    <CCard>
      <LocationFilter
        states={states}
        filteredCities={filteredCities}
        zipCodes={zipCodes}
        onFiltersChange={onFiltersChange}
      />
      <MapContainer
        locations={siteList}
        renderMarker={renderSiteMarker}
      />
      <CCardBody>
        <CCardTitle>
          Sites List
        </CCardTitle>
        <CListGroup>
          {siteList.map(({ id, name }) => (
            <CListGroupItem
              key={id}
              className="d-flex justify-content-between align-items-center py-3"
              onClick={() => handleSiteClick(id)}
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
          siteId={selectedSite}
        />
      )}
    </CCard>
  );
};

export default SiteAnalytics;
