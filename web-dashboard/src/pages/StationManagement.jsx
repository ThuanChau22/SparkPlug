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
import "leaflet/dist/leaflet.css";

import StationDetailsModal from "../components/StationDetailsModal";
import StationEditModal from "../components/StationEditModal";
import StationAddModal from "../components/StationAddModal";
import LocationFilter from "../components/LocationFilter";
import { stationIcon } from "../assets/mapIcons";
import MapContainer from "../components/MapContainer";
import StationMarker from "../components/StationMarker";
import {
  stationGetAll,
  stationUpdateById,
  stationDeleteById,
  selectStationList,
} from "redux/station/stationSlide";
import "../scss/StationManagement.scss";

const StationManagement = () => {
  const stationList = useSelector(selectStationList);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingStationId, setEditingStationId] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zipCodes, setZipCodes] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(stationGetAll());
  }, [dispatch]);

  useEffect(() => {
    if (stationList) {
      const uniqueStates = Array.from(new Set(stationList.map(station => station.state))).sort((a, b) => a.localeCompare(b));
      const uniqueCities = Array.from(new Set(stationList.map(station => station.city))).sort((a, b) => a.localeCompare(b));
      const uniqueZips = Array.from(new Set(stationList.map(station => station.zip_code))).sort((a, b) => a.localeCompare(b));
      setStates(["All", ...uniqueStates]);
      setCities(["All", ...uniqueCities]);
      setZipCodes(["All", ...uniqueZips]);
      setFilteredCities(["All", ...uniqueCities]);
    }
  }, [stationList]);

  const applyFilters = (state, city, zip) => {
    let queryParams = [];
    if (zip !== "All") {
      queryParams.push(`zip=${encodeURIComponent(zip)}`);
    } else {
      if (state !== "All") {
        queryParams.push(`state=${encodeURIComponent(state)}`);
      }
      if (city !== "All") {
        queryParams.push(`city=${encodeURIComponent(city)}`);
      }
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    dispatch(stationGetAll(queryString));
  };

  const onFiltersChange = (newState, newCity, newZip) => {
    applyFilters(newState, newCity, newZip);
  };

  const handleStationClick = (stationId) => {
    const station = stationList.find(s => s.id === stationId);
    setSelectedStation(station);
    setIsDetailsModalOpen(true);
  };

  const handleEditStation = (e, stationId) => {
    setEditingStationId(stationId);
    setIsDetailsModalOpen(false);
    e.stopPropagation();
  };

  const handleDeleteStation = (e, stationId) => {
    dispatch(stationDeleteById(stationId));
    e.stopPropagation();
  };

  const saveEditedStation = (id, name, price) => {
    const stationData = {
      id, name,
      price: parseFloat(price)
    };
    dispatch(stationUpdateById(stationData));
  };

  const renderStationMarker = station => (
    <StationMarker
      key={station.id}
      station={station}
      icon={stationIcon}
      onMarkerClick={() => handleStationClick(station.id)}
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
      <MapContainer locations={stationList} renderMarker={renderStationMarker} />
      <CCardBody>
        <CCardTitle Listle className="mb-3">
          Stations List
          <CButton
            className="float-end mx-4"
            variant="outline"
            color="info"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Station
          </CButton>
        </CCardTitle>
        <CListGroup>
          {stationList.map(({ id, name }) => (
            <CListGroupItem
              key={id}
              className="d-flex justify-content-between align-items-center py-3"
              onClick={() => handleStationClick(id)}
            >
              <div>ID: {id}</div>
              <div>{name}</div>
              <div className="station-actions">
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="warning"
                  onClick={(evt) => handleEditStation(evt, id)}
                >
                  Edit
                </CButton>
                <CButton
                  className="mx-1"
                  variant="outline"
                  color="danger"
                  onClick={(evt) => handleDeleteStation(evt, id)}
                >
                  Delete
                </CButton>
              </div>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
      <StationAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      {editingStationId && (
        <StationEditModal
          isOpen={Boolean(editingStationId)}
          onClose={() => setEditingStationId(null)}
          stationId={editingStationId}
          onSave={saveEditedStation}
        />
      )}
      {isDetailsModalOpen && (
        <StationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          stationData={selectedStation}
        />
      )}
    </CCard>
  );
};

export default StationManagement;
