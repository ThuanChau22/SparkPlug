import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
} from "@coreui/react";

import StickyContainer from "components/StickyContainer";
import StationAddModal from "components/StationManagement/AddModal";
import StationDetailsModal from "components/StationManagement/DetailsModal";
import StationListView from "components/StationManagement/ListView";
import StationMapView from "components/StationManagement/MapView";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  stationStateDeleteMany,
  stationStateClear,
  selectStationList,
} from "redux/station/stationSlice";
import { evseStateClear } from "redux/evse/evseSlice";
import utils from "utils";

const StationManagement = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationList = useSelector(selectStationList);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const listRefHeight = useMemo(() => {
    return headerHeight + titleHeight;
  }, [headerHeight, titleHeight]);

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

  useEffect(() => () => {
    dispatch(stationStateClear());
    dispatch(evseStateClear());
  }, [dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsDetailsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5}>
          <CCardBody className="d-flex flex-column h-100 p-0 pb-3">
            <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="d-flex justify-content-between align-items-center px-3 py-2 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Management
                <CButton
                  variant="outline"
                  color="info"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Station
                </CButton>
              </CCardTitle>
            </StickyContainer>
            <StationListView
              refHeight={listRefHeight}
              handleViewStation={handleViewStation}
            />
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7}>
          <StationMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
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
