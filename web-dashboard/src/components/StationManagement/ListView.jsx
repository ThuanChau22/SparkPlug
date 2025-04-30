import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  CButton,
  CCardTitle,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import SearchBar from "components/SearchBar";
import StickyContainer from "components/StickyContainer";
import useMapParams from "hooks/useMapParams";
import useSearchParam from "hooks/useSearchParam";
import useFetchData from "hooks/useFetchData";
import useFetchDataOnScroll from "hooks/useFetchDataOnScroll";
import useWindowResize from "hooks/useWindowResize";
import { selectLayoutHeaderHeight } from "redux/layout/layoutSlice";
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

const StationListView = ({ title, openAddModal, openViewModal }) => {
  const ListLimit = 25;
  const listRef = useRef({});

  const headerHeight = useSelector(selectLayoutHeaderHeight);

  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);

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

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});
  const stationListByPage = useMemo(() => (
    stationList.filter((_, index) => index < ListLimit * listPage)
  ), [stationList, listPage]);

  const [mapParams] = useMapParams();
  const [search] = useSearchParam();

  const { latLngOrigin, latLngMin, latLngMax } = useMemo(() => ({
    latLngOrigin: authIsOwner || mapExist || search ? "" : "default",
    latLngMin: search ? "" : utils.toLatLngString(mapLowerBound),
    latLngMax: search ? "" : utils.toLatLngString(mapUpperBound),
  }), [authIsOwner, mapExist, search, mapLowerBound, mapUpperBound]);

  const limit = useMemo(() => (
    !authIsOwner || mapExist || search ? ListLimit : 1
  ), [authIsOwner, mapExist, search]);

  const fetchParams = useMemo(() => ({
    fields: stationSelectedFields.join(),
    sortBy: search ? "-search_score" : "",
    search, latLngOrigin, latLngMin, latLngMax, limit,
  }), [stationSelectedFields, search, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || search || mapIsZoomInLimit,
    action: useCallback(() => stationGetList(fetchParams), [fetchParams]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => stationGetList({
      fields: stationSelectedFields.join(),
      sortBy: search ? "-search_score" : "",
      limit: ListLimit,
      cursor: listCursor.next,
      search, latLngMin, latLngMax,
    }), [stationSelectedFields, search, latLngMin, latLngMax, listCursor.next]),
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
          {openAddModal && (
            <CButton
              className="w-100 mt-2"
              variant="outline"
              color="info"
              onClick={openAddModal}
            >
              Add Station
            </CButton>
          )}
        </CCardTitle>
      </StickyContainer>
      <div className="d-flex flex-column" style={{ height: `${listHeight}px` }}>
        {loading
          ? (<LoadingIndicator loading={loading} />)
          : (stationListByPage.length > 0
            ? (
              <CListGroup className="px-3 pb-3">
                <>
                  {stationListByPage.map(({ id, name, street_address, city, state, zip_code }) => (
                    <CListGroupItem
                      key={id}
                      className="border rounded py-3 my-1 shadow-sm"
                      as="button"
                      onClick={() => openViewModal(id)}
                    >
                      <p className="mb-0 text-secondary">
                        {`ID: ${id}`}
                      </p>
                      <p className="mb-0 text-secondary small">
                        {street_address}, {city}, {state} {zip_code}
                      </p>
                      <p className="mb-0">{name}</p>
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

export default StationListView;
