import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import DriverStationListItem from "components/DriverStation/StationListItem";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useMapParams from "hooks/useMapParams";
import useWindowResize from "hooks/useWindowResize";
import {
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapLocation,
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
} from "redux/station/stationSlice";
import utils from "utils";

const DriverStationListView = ({ refHeight, handleViewStation }) => {
  const ListLimit = 50;
  const listRef = useRef({});

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapLocation = useSelector(selectMapLocation);

  const stationSelectedFields = useMemo(() => ([
    StationFields.name,
    StationFields.streetAddress,
    StationFields.city,
    ...!mapLocation.located ? [] : [
      "distance"
    ],
  ]), [mapLocation]);
  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(() => {
    setListHeight(window.innerHeight - refHeight);
  });

  const { latLngMin, latLngMax } = useMemo(() => {
    const latLngMin = utils.toLatLngString(mapLowerBound);
    const latLngMax = utils.toLatLngString(mapUpperBound);
    return { latLngMin, latLngMax };
  }, [mapLowerBound, mapUpperBound]);

  const stationListByPage = useMemo(() => {
    if (mapLocation.located) {
      stationList.sort((a, b) => a.distance - b.distance || a.id - b.id);
    }
    return stationList.filter((_, index) => index < ListLimit * listPage);
  }, [stationList, mapLocation, listPage]);

  const [mapParams] = useMapParams();

  const fetchOnLoad = useMemo(() => (
    !mapLocation.located && !mapParams.exist && !latLngMin && !latLngMax
  ), [latLngMin, latLngMax, mapParams, mapLocation]);

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
      ...!mapLocation.located ? {} : {
        latLngOrigin: utils.toLatLngString(mapLocation),
        sortBy: "distance"
      },
      limit: ListLimit,
    }), [stationSelectedFields, latLngMin, latLngMax, mapLocation]),
  });

  useEffect(() => {
    console.log(stationList);
  }, [stationList]);

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => stationGetList({
      latLngMin, latLngMax,
      ...!mapLocation.located ? {} : {
        latLngOrigin: utils.toLatLngString(mapLocation),
        sortBy: "distance"
      },
      limit: ListLimit,
      cursor: listCursor.next,
    }), [latLngMin, latLngMax, listCursor.next, mapLocation]),
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
      listRef.current.scrollTop = 0;
      setListCursor(dataOnMapView.cursor);
      setListPage(1);
    }
  }, [dataOnMapView, loadStateOnMapView]);

  useEffect(() => {
    if (dataOnScroll && loadStateOnScroll.done) {
      setListCursor(dataOnScroll.cursor);
      setListPage((state) => state + 1);
    }
  }, [dataOnScroll, loadStateOnScroll]);

  return loading
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
              {stationListByPage.map(({ id }) => (
                <CListGroupItem
                  key={id}
                  className="d-flex justify-content-between align-items-center border rounded py-3 my-1 shadow-sm"
                  as="button"
                  onClick={() => handleViewStation(id)}
                >
                  <DriverStationListItem stationId={id} />
                </CListGroupItem>
              ))}
            </>
          )
          : (
            <div className="d-flex flex-grow-1 justify-content-center align-items-center">
              <span className="text-secondary">No stations found</span>
            </div>
          )}
      </CListGroup>
    );
};

export default DriverStationListView;
