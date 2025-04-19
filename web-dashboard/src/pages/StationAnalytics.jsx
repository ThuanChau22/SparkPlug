import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardTitle,
  CCardBody,
} from "@coreui/react";

import StickyContainer from "components/StickyContainer";
import StationAnalyticsDetailsModal from "components/StationAnalytics/DetailsModal";
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
import utils from "utils";

const StationAnalytics = () => {
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

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
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
  }, [dispatch]);

  const handleViewStation = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
        <CCol md={6} lg={5} xl={4}>
          <CCardBody className="d-flex flex-column h-100 p-0">
            <StickyContainer ref={titleRef} style={{ top: `${headerHeight}px` }}>
              <CCardTitle
                className="p-3 m-0 shadow-sm"
                style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
              >
                Stations Analytics
              </CCardTitle>
            </StickyContainer>
            <StationListView
              refHeight={listRefHeight}
              handleViewStation={handleViewStation}
            />
          </CCardBody>
        </CCol>
        <CCol md={6} lg={7} xl={8}>
          <StationMapView handleViewStation={handleViewStation} />
        </CCol>
      </CRow>
      {isAnalyticsModalOpen && (
        <StationAnalyticsDetailsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          stationId={stationId}
        />
      )}
    </CCard >
  );
};

export default StationAnalytics;
