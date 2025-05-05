import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCardTitle,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import { StationEstWaitTimeAPI } from "configs";
import LoadingIndicator from "components/LoadingIndicator";
import StickyContainer from "components/StickyContainer";
import SearchBar from "components/SiteManagement/SearchBar";
import DriverStationListItem from "components/DriverStation/StationListItem";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useMapParam from "hooks/useMapParam";
import useViewParam from "hooks/useViewParam";
import useWindowResize from "hooks/useWindowResize";
import { apiInstance, handleError } from "redux/api";
import {
  LayoutView,
  selectLayoutMobile,
  selectLayoutHeaderHeight,
} from "redux/app/layoutSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  selectMapExist,
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
import {
  EvseStatus,
  selectEvseStatusEntities,
} from "redux/evse/evseStatusSlice";
import utils from "utils";

const DriverStationListView = ({ title, openViewModal }) => {
  const ListLimit = 25;
  const listRef = useRef({});

  const isMobile = useSelector(selectLayoutMobile);
  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const authToken = useSelector(selectAuthAccessToken);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);
  const mapLocation = useSelector(selectMapLocation);

  const stationSelectedFields = useMemo(() => ([
    StationFields.name,
    StationFields.latitude,
    StationFields.longitude,
    StationFields.streetAddress,
    StationFields.city,
    StationFields.state,
    StationFields.zipCode,
  ]), []);

  const stationList = useSelector((state) => {
    return selectStationListByFields(state, stationSelectedFields);
  });

  const stationStatusEntities = useSelector(selectStationStatusEntities);

  const evseStatusEntities = useSelector(selectEvseStatusEntities);

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});
  const stationListByPage = useMemo(() => {
    return stationList.filter((_, index) => index < ListLimit * listPage);
  }, [stationList, listPage]);

  const [mapParam] = useMapParam();
  const [viewParam] = useViewParam();
  const [searchParam] = useSearchParam();

  const isMobileListView = useMemo(() => (
    isMobile && viewParam === LayoutView.List
  ), [isMobile, viewParam]);

  const latLngOrigin = useMemo(() => {
    if (mapLocation.located) {
      return utils.toLatLngString(mapLocation);
    }
    return mapExist || searchParam ? "" : "default";
  }, [mapExist, mapLocation, searchParam]);

  const { latLngMin, latLngMax } = useMemo(() => {
    const latLngMin = searchParam ? "" : utils.toLatLngString(mapLowerBound);
    const latLngMax = searchParam ? "" : utils.toLatLngString(mapUpperBound);
    return { latLngMin, latLngMax };
  }, [searchParam, mapLowerBound, mapUpperBound]);

  const sortBy = useMemo(() => {
    const orders = [];
    if (searchParam) {
      orders.push("-search_score");
    }
    if (mapLocation.located) {
      orders.push("distance");
    }
    return orders.join();
  }, [mapLocation, searchParam]);

  const limit = useMemo(() => (
    isMobile || mapExist || searchParam ? ListLimit : 5
  ), [isMobile, mapExist, searchParam]);

  const fetchParams = useMemo(() => ({
    fields: stationSelectedFields.join(),
    search: searchParam,
    latLngOrigin, latLngMin, latLngMax, sortBy, limit,
  }), [stationSelectedFields, searchParam, latLngOrigin, latLngMin, latLngMax, sortBy, limit]);

  const { data, loadState } = useFetchData({
    condition: isMobileListView || !mapParam || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      search: searchParam,
      limit: ListLimit,
      cursor: listCursor.next,
      latLngOrigin, latLngMin, latLngMax, sortBy,
    }), [stationSelectedFields, searchParam, latLngOrigin, latLngMin, latLngMax, sortBy, listCursor.next]),
    ref: listRef,
    cursor: listCursor,
  });

  const loading = useMemo(() => (
    !(mapExist && data) && loadState.loading
  ), [mapExist, data, loadState]);

  useEffect(() => {
    if (data && loadState.done) {
      setListCursor(data.cursor);
      setListPage(1);
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
  }, [data, loadState]);

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
    const occupiedEvses = stationList.filter(({ id }) => (
      stationStatusEntities[id] === EvseStatus.Occupied
    )).reduce((list, { id }) => (
      list.concat(evseStatusEntities[id])
    ), []).map((evse) => ({
      station_id: evse.stationId,
      evse_id: evse.evseId,
      latitude: evse.latitude,
      longitude: evse.longitude,
      hour_of_day, day_of_week,
    }));
    if (occupiedEvses.length === 0) return;
    fetchWaitTimes(occupiedEvses);
  }, [stationList, stationStatusEntities, evseStatusEntities, fetchWaitTimes]);

  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useCallback((node) => {
    setTitleHeight(node?.getBoundingClientRect().height);
  }, []);

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(useCallback(() => {
    const refHeight = headerHeight + titleHeight;
    setListHeight(window.innerHeight - refHeight);
  }, [headerHeight, titleHeight]));

  return (
    <div ref={listRef} className="overflow-auto">
      <StickyContainer ref={titleRef} style={{ top: "0px" }}>
        <CCardTitle
          className="px-3 py-2 m-0 shadow-sm"
          style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
        >
          {title && (<p className="my-2">{title}</p>)}
          <SearchBar placeholder="Search by name or location" />
        </CCardTitle>
      </StickyContainer>
      <div className="d-flex flex-column" style={{ height: `${listHeight}px` }}>
        {loading
          ? (<LoadingIndicator loading={loading} />)
          : (stationListByPage.length > 0
            ? (
              <CListGroup className="px-3 pb-3">
                <>
                  {stationListByPage.map(({ id }) => (
                    <CListGroupItem
                      key={id}
                      className="border-0 p-0"
                      as="button"
                      onClick={() => openViewModal(id)}
                    >
                      <DriverStationListItem
                        stationId={id}
                        waitTime={Math.round(waitTimeByStation[id] || 0)}
                      />
                    </CListGroupItem>
                  ))}
                  {loadStateOnScroll.loading && (
                    <LoadingIndicator loading={loadStateOnScroll.loading} />
                  )}
                </>
              </CListGroup>
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
            )
          )
        }
      </div>
    </div>
  );
};

export default DriverStationListView;
