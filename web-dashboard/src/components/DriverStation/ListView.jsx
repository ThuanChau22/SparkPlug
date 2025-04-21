import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { StationEstWaitTimeAPI } from "api-endpoints";
import LoadingIndicator from "components/LoadingIndicator";
import DriverStationListItem from "components/DriverStation/StationListItem";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnMapView from "hooks/useFetchDataOnMapView";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useMapParams from "hooks/useMapParams";
import useWindowResize from "hooks/useWindowResize";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapIsZoomInLimit,
  selectMapLocation,
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
  selectStationStatusEntities,
} from "redux/station/stationSlice";
import { selectEvseList } from "redux/evse/evseSlice";
import { EvseStatus } from "redux/evse/evseStatusSlice";
import utils from "utils";

const DriverStationListView = ({ refHeight, handleViewStation }) => {
  const ListLimit = 50;
  const listRef = useRef({});

  const authToken = useSelector(selectAuthAccessToken);

  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);
  const mapLocation = useSelector(selectMapLocation);

  const stationSelectedFields = useMemo(() => ([
    StationFields.name,
    StationFields.streetAddress,
    StationFields.city,
    ...mapLocation.located ? ["distance"] : [],
  ]), [mapLocation]);
  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  const stationStatusEntities = useSelector(selectStationStatusEntities);

  const evseList = useSelector(selectEvseList);

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

  const stationListByPage = useMemo(() => {
    if (mapLocation.located) {
      stationList.sort((a, b) => a.distance - b.distance || a.id - b.id);
    }
    return stationList.filter((_, index) => index < ListLimit * listPage);
  }, [stationList, mapLocation, listPage]);

  const [mapParams] = useMapParams();

  const fetchOnLoad = useMemo(() => (
    (!mapParams.exist && !latLngMin && !latLngMax)
    || (mapLocation.located && latLngMin && latLngMax)
  ), [latLngMin, latLngMax, mapParams, mapLocation]);

  const { data, loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngOrigin: "default",
      sortBy: "distance",
      limit: ListLimit,
      ...!mapLocation.located ? {} : {
        latLngOrigin: utils.toLatLngString(mapLocation),
        latLngMin, latLngMax,
      },
    }), [stationSelectedFields, latLngMin, latLngMax, mapLocation]),
  });

  const {
    data: dataOnMapView,
    loadState: loadStateOnMapView,
  } = useFetchDataOnMapView({
    condition: !loadState.loading && mapIsZoomInLimit,
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      latLngMin, latLngMax,
      limit: ListLimit,
      ...!mapLocation.located ? {} : {
        latLngOrigin: utils.toLatLngString(mapLocation),
        sortBy: "distance",
      },
    }), [stationSelectedFields, latLngMin, latLngMax, mapLocation]),
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
      ...!mapLocation.located ? {} : {
        latLngOrigin: utils.toLatLngString(mapLocation),
        sortBy: "distance",
      },
    }), [stationSelectedFields, latLngMin, latLngMax, listCursor.next, mapLocation]),
    ref: listRef,
    cursor: listCursor,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadState.done && loadStateOnMapView.done) {
      setLoading(false);
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

  const dispatch = useDispatch();

  const [waitTimeByStation, setWaitTimeByStation] = useState({});

  const fetchWaitTimes = useCallback(async (body) => {
    try {
      const baseURL = StationEstWaitTimeAPI;
      const headers = { Authorization: `Bearer ${authToken}` };
      const { data } = await apiInstance.post(baseURL, body, { headers });
      const waitTimes = {};
      for (const { station_id, wait_time } of data) {
        const currentMin = waitTimes[station_id] || Infinity;
        waitTimes[station_id] = Math.min(currentMin, wait_time);
      }
      setWaitTimeByStation(waitTimes);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [authToken, dispatch]);

  useEffect(() => {
    const currentDateTime = new Date();
    const hour_of_day = currentDateTime.getHours();
    const day_of_week = (currentDateTime.getDay() + 6) % 7;
    const body = evseList.filter(({ station_id }) => (
      stationStatusEntities[station_id] === EvseStatus.Occupied
    )).map(({ station_id, evse_id, latitude, longitude }) => ({
      station_id, evse_id, latitude, longitude,
      hour_of_day, day_of_week,
    }));
    if (body.length === 0) return;
    fetchWaitTimes(body);
  }, [stationStatusEntities, evseList, fetchWaitTimes]);

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
                  <DriverStationListItem
                    stationId={id}
                    waitTime={Math.round(waitTimeByStation[id] || 0) || null}
                  />
                </CListGroupItem>
              ))}
            </>
          )
          : (
            <div className="d-flex flex-grow-1 justify-content-center align-items-center">
              <span className="text-secondary">
                {mapIsZoomInLimit
                  ? "No stations found"
                  : "Zoom in on map to display information"
                }
              </span>
            </div>
          )}
      </CListGroup>
    );
};

export default DriverStationListView;
