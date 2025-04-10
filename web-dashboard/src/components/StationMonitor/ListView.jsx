import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import StationMonitorListItem from "components/StationMonitor/StationListItem";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useMapParams from "hooks/useMapParams";
import useWindowResize from "hooks/useWindowResize";
import {
  selectMapLowerBound,
  selectMapUpperBound,
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
} from "redux/station/stationSlice";
import utils from "utils";

const StationMonitorListView = ({ refHeight, handleViewStation }) => {
  const ListLimit = 50;
  const listRef = useRef({});

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);

  const stationSelectedFields = useMemo(() => ([
    StationFields.name,
    StationFields.streetAddress,
    StationFields.city,
  ]), []);
  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(useCallback(() => {
    setListHeight(window.innerHeight - refHeight);
  }, [refHeight]));

  const { latLngMin, latLngMax } = useMemo(() => {
    const latLngMin = utils.toLatLngString(mapLowerBound);
    const latLngMax = utils.toLatLngString(mapUpperBound);
    return { latLngMin, latLngMax };
  }, [mapLowerBound, mapUpperBound]);

  const stationListByPage = useMemo(() => (
    stationList.filter((_, index) => index < ListLimit * listPage)
  ), [stationList, listPage]);

  const [mapParams] = useMapParams();

  const fetchOnLoad = useMemo(() => (
    !mapParams.exist && !latLngMin && !latLngMax
  ), [latLngMin, latLngMax, mapParams]);

  const { data, loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngOrigin: "default",
      limit: ListLimit,
    }), [stationSelectedFields]),
  });

  const {
    data: dataOnMapView,
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
      limit: ListLimit,
    }), [stationSelectedFields, latLngMin, latLngMax]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
      limit: ListLimit,
      cursor: listCursor.next,
    }), [stationSelectedFields, latLngMin, latLngMax, listCursor.next]),
    ref: listRef,
    cursor: listCursor,
  });

  const loading = useMemo(() => (
    loadState.loading || (loadState.idle && loadStateOnMapView.loading)
  ), [loadState, loadStateOnMapView]);

  useEffect(() => {
    if (loadState.idle && loadStateOnMapView.done) {
      loadState.setDone();
    }
  }, [loadState, loadStateOnMapView]);

  useEffect(() => {
    if (data && loadState.done) {
      setListCursor(data.cursor);
      setListPage(1);
    }
  }, [data, loadState]);

  useEffect(() => {
    if (dataOnMapView && loadStateOnMapView.done) {
      setListCursor(dataOnMapView.cursor);
      setListPage(1);
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
  }, [dataOnMapView, loadStateOnMapView]);

  useEffect(() => {
    if (dataOnScroll && loadStateOnScroll.done) {
      setListCursor(dataOnScroll.cursor);
      setListPage((state) => state + 1);
    }
  }, [dataOnScroll, loadStateOnScroll]);

  return (loading
    ? <LoadingIndicator loading={loading} />
    : (
      <CListGroup
        ref={listRef}
        className="overflow-auto px-3 pb-3"
        style={{ height: `${listHeight}px` }}
      >
        {stationListByPage.length > 0
          ? (
            <>
              {stationListByPage.map(({ id }) => {
                return (
                  <CListGroupItem
                    key={id}
                    className="d-flex justify-content-between align-items-center border rounded py-3 my-1 shadow-sm"
                    as="button"
                    onClick={() => handleViewStation(id)}
                  >
                    <StationMonitorListItem stationId={id} />
                  </CListGroupItem>
                )
              })}
            </>
          )
          : (
            <div className="d-flex flex-grow-1 justify-content-center align-items-center">
              <span className="text-secondary">No stations found</span>
            </div>
          )
        }
      </CListGroup>
    ));
};

export default StationMonitorListView;
