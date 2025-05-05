import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

import StationAnalyticsDetailsModal from "components/StationAnalytics/DetailsModal";
import StationListView from "components/StationManagement/ListView";
import StationMapView from "components/StationManagement/MapView";
import useViewParam from "hooks/useViewParam";
import useSearchParam from "hooks/useSearchParam";
import useSearchParamsHandler from "hooks/useSearchParamsHandler";
import {
  LayoutView,
  layoutStateSetView,
  selectLayoutMobile,
  selectLayoutView,
} from "redux/app/layoutSlice";
import {
  mapStateSet,
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
  const isMobile = useSelector(selectLayoutMobile);
  const layoutView = useSelector(selectLayoutView);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationList = useSelector(selectStationList);

  const [viewParam] = useViewParam();
  const [searchParam] = useSearchParam();

  const {
    syncSearchParams,
    clearSearchOnMap,
    setViewOnMobile,
    clearMapOnSearchInMobileListView,
  } = useSearchParamsHandler();

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [stationId, setStationId] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    syncSearchParams();
  }, [syncSearchParams]);

  useEffect(() => {
    clearSearchOnMap();
  }, [clearSearchOnMap]);

  useEffect(() => {
    setViewOnMobile();
  }, [setViewOnMobile]);

  useEffect(() => {
    clearMapOnSearchInMobileListView();
  }, [clearMapOnSearchInMobileListView]);

  useEffect(() => {
    if (isMobile && viewParam) {
      dispatch(layoutStateSetView(viewParam));
    }
  }, [isMobile, viewParam, dispatch]);

  useEffect(() => {
    if (searchParam) {
      dispatch(mapStateSet({
        center: null,
        lowerBound: null,
        upperBound: null,
        zoom: null,
      }));
      dispatch(stationStateClear());
    }
  }, [searchParam, dispatch]);

  useEffect(() => {
    const stationIds = utils.outOfBoundResources(stationList, {
      lowerBound: mapLowerBound,
      upperBound: mapUpperBound,
    }).map(({ id }) => id);
    dispatch(stationStateDeleteMany(stationIds));
  }, [stationList, mapLowerBound, mapUpperBound, dispatch]);

  useEffect(() => {
    if (isMobile && viewParam) {
      dispatch(layoutStateSetView(viewParam));
    }
  }, [isMobile, viewParam, dispatch]);

  useEffect(() => () => {
    dispatch(stationStateClear());
  }, [dispatch]);

  const handleOpenViewModal = (stationId) => {
    setStationId(stationId);
    setIsAnalyticsModalOpen(true);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0">
        <CRow className="flex-grow-1" xs={{ gutterX: 0 }}>
          {(!isMobile || layoutView === LayoutView.List) && (
            <CCol md={6} lg={5} xl={4}>
              <StationListView
                title={"Station Analytics"}
                openViewModal={handleOpenViewModal}
              />
            </CCol>
          )}
          {(!isMobile || layoutView === LayoutView.Map) && (
            <CCol md={6} lg={7} xl={8}>
              <StationMapView handleViewStation={handleOpenViewModal} />
            </CCol>
          )}
        </CRow>
      </CCardBody>
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
