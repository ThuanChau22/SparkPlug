import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardTitle,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import "leaflet/dist/leaflet.css";

import { siteIcon } from "assets/mapIcons";
import SiteAddModal from "components/SiteAddModal";
import SiteDetailsModal from "components/SiteDetailsModal";
import SiteEditModal from "components/SiteEditModal";
import LocationFilter from "components/LocationFilter";
import MapContainer from "components/MapContainer";
import SiteMarker from "components/SiteMarker";
import {
  siteGetAll,
  siteDeleteById,
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

const SiteManagement = () => {
  const siteList = useSelector(selectSiteList);
  const siteSelectedState = useSelector(selectSelectedState);
  const siteStateOptions = useSelector(selectStateOptions);
  const siteSelectedCity = useSelector(selectSelectedCity);
  const siteCityOptions = useSelector(selectCityOptions);
  const siteSelectedZipCode = useSelector(selectSelectedZipCode);
  const siteZipCodeOptions = useSelector(selectZipCodeOptions);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModelOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [editingSiteId, setEditingSiteId] = useState(null);
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
        <CCardTitle className="d-flex flex-row justify-content-between align-items-center mb-3">
          Sites List
          <CButton
            className="mx-5"
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
              className="list-item d-flex justify-content-between align-items-center py-3"
              onClick={() => handleViewSite(id)}
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
