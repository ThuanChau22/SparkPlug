import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import SiteDetailsModal from "../components/SiteDetailsModal";
import SiteAddModal from "../components/SiteAddModal";
import SiteEditModal from "../components/SiteEditModal";
import {
  siteGetAll,
  siteDeleteById,
  selectSiteList,
} from "redux/site/siteSlide";

import { siteIcon } from '../assets/mapIcons';
import MapContainer from '../components/MapContainer';
import SiteMarker from '../components/SiteMarker';
import 'leaflet/dist/leaflet.css';

import LocationFilter from '../components/LocationFilter';

const SiteManagement = () => {
  const siteList = useSelector(selectSiteList);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModelOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [filterState, setFilterState] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterZip, setFilterZip] = useState('All');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zipCodes, setZipCodes] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siteList.length === 0) {
      dispatch(siteGetAll());
    }
  }, [siteList, dispatch]);

  useEffect(() => {
    if (siteList) {
      const uniqueStates = Array
        .from(new Set(siteList.map(site => site.state)))
        .sort((a, b) => a.localeCompare(b));
      const uniqueCities = Array
        .from(new Set(siteList.map(site => site.city)))
        .sort((a, b) => a.localeCompare(b));
      const uniqueZips = Array
        .from(new Set(siteList.map(site => site.zip_code)))
        .sort((a, b) => a.localeCompare(b));
      setStates(['All', ...uniqueStates]);
      setCities(['All', ...uniqueCities]);
      setZipCodes(['All', ...uniqueZips]);
    }
  }, [siteList]);

  useEffect(() => {
    if (filterState !== 'All') {
      const citiesInState = Array
        .from(new Set(siteList
          .filter(site => site.state === filterState)
          .map(site => site.city)))
        .sort((a, b) => a.localeCompare(b));
      setFilteredCities(['All', ...citiesInState]);
    } else {
      setFilteredCities(['All', ...Array
        .from(new Set(siteList.map(site => site.city)))
        .sort((a, b) => a.localeCompare(b))]);
    }
  }, [filterState, siteList]);

  useEffect(() => {
    applyFilters(filterState, filterCity, filterZip);
  }, [filterState, filterCity, filterZip]);

  const handleSiteClick = (siteId) => {
    setSelectedSiteId(siteId);
    setIsDetailsModalOpen(true);
  };

  const handleEditSite = (e, siteId) => {
    setEditingSiteId(siteId);
    setIsEditModalOpen(true);
    e.stopPropagation();
  };

  const handleDeleteSite = (e, siteId) => {
    dispatch(siteDeleteById(siteId));
    e.stopPropagation();
  };

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
    setFilterState(newState);
    setFilterCity(newCity);
    setFilterZip(newZip);
    applyFilters(newState, newCity, newZip);
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
        <CCardTitle className="mb-3">
          Sites List
          <CButton
            className="float-end mx-5"
            variant="outline"
            color="info"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Site
          </CButton>
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
              <div>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="warning"
                  onClick={(e) => handleEditSite(e, id)}
                >
                  Edit
                </CButton>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="danger"
                  onClick={(e) => handleDeleteSite(e, id)}
                >
                  Delete
                </CButton>
              </div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      {isAddModalOpen &&
        <SiteAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      }
      {isDetailsModalOpen &&
        <SiteDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          siteId={selectedSiteId}
        />
      }
      {isEditModelOpen &&
        <SiteEditModal
          isOpen={isEditModelOpen}
          onClose={() => setIsEditModalOpen(false)}
          siteId={editingSiteId}
        />
      }
    </CCard >
  );
};

export default SiteManagement;
