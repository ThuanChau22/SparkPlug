import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

import StationAddModal from "components/StationManagement/AddModal";
import StationDetailsModal from "components/StationManagement/DetailsModal";
import StationListView from "components/StationManagement/ListView";
import StationMapView from "components/StationManagement/MapView";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  stationStateDeleteMany,
  stationStateClear,
  selectStationList,
} from "redux/station/stationSlice";
import {
  evseStateDeleteMany,
  evseStateClear,
  selectEvseList,
} from "redux/evse/evseSlice";
import utils from "utils";

const StationManagement = () => {
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationList = useSelector(selectStationList);
  const evseList = useSelector(selectEvseList);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const stationIds = utils.outOfBoundResources(stationList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(stationStateDeleteMany(stationIds));
  }, [stationList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    const evseIds = utils.outOfBoundResources(evseList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ station_id, evse_id }) => ({ station_id, evse_id }));
    dispatch(evseStateDeleteMany(evseIds));
  }, [evseList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => () => {
    dispatch(stationStateClear());
    dispatch(evseStateClear());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (stationId) => {
    setStationId(stationId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0">
        <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
          <CCol md={6} lg={5} xl={4}>
            <StationListView
              title={"Station Management"}
              openAddModal={handleOpenAddModal}
              openViewModal={handleOpenViewModal}
            />
          </CCol>
          <CCol md={6} lg={7} xl={8}>
            <StationMapView openViewModal={handleOpenViewModal} />
          </CCol>
        </CRow>
      </CCardBody>
      {isAddModalOpen && (
        <StationAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {isDetailsModalOpen && (
        <StationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard>
  );
};

export default StationManagement;
