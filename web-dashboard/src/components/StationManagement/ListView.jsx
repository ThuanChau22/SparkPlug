import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import useMapParams from "hooks/useMapParams";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useWindowResize from "hooks/useWindowResize";
import { selectAuthRoleIsOwner } from "redux/auth/authSlice";
import {
  selectMapExist,
  selectMapLowerBound,
  selectMapUpperBound,
  selectMapIsZoomInLimit,
} from "redux/map/mapSlice";
import {
  StationFields,
  stationGetList,
  selectStationListByFields,
} from "redux/station/stationSlice";
import utils from "utils";

const StationListView = ({ refHeight, handleViewStation }) => {
  const ListLimit = 25;
  const listRef = useRef({});

  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);

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
  const stationListByPage = useMemo(() => (
    stationList.filter((_, index) => index < ListLimit * listPage)
  ), [stationList, listPage]);

  const [mapParams] = useMapParams();

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist ? "" : "default",
    latLngMin: utils.toLatLngString(mapLowerBound),
    latLngMax: utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    authIsOwner && !mapExist ? 5 : ListLimit
  ), [authIsOwner, mapExist]);

  const fetchParams = useMemo(() => ({
    fields: stationSelectedFields.join(),
    latLngOrigin, latLngMin, latLngMax, limit,
  }), [stationSelectedFields, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
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
    !data && loadState.loading
  ), [data, loadState]);

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

  const [listHeight, setListHeight] = useState(0);
  useWindowResize(useCallback(() => {
    setListHeight(window.innerHeight - refHeight);
  }, [refHeight]));

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
              {stationListByPage.map(({ id, name, street_address, city }) => (
                <CListGroupItem
                  key={id}
                  className="border rounded py-3 my-1 shadow-sm"
                  as="button"
                  onClick={() => handleViewStation(id)}
                >
                  <p className="mb-0 text-secondary">
                    {`ID: ${id}`}
                  </p>
                  <p className="mb-0 text-secondary small">
                    {street_address}, {city}
                  </p>
                  <p className="mb-0">{name}</p>
                </CListGroupItem>
              ))}
              {loadStateOnScroll.loading && (
                <LoadingIndicator loading={loadStateOnScroll.loading} />
              )}
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
          )
        }
      </CListGroup>
    ));
};

export default StationListView;
