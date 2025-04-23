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
  SiteFields,
  siteGetList,
  selectSiteListByFields,
} from "redux/site/siteSlice";
import utils from "utils";

const SiteListView = ({ refHeight, handleViewSite }) => {
  const ListLimit = 25;
  const listRef = useRef({});

  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const mapExist = useSelector(selectMapExist);
  const mapLowerBound = useSelector(selectMapLowerBound);
  const mapUpperBound = useSelector(selectMapUpperBound);
  const mapIsZoomInLimit = useSelector(selectMapIsZoomInLimit);

  const siteSelectedFields = useMemo(() => ([
    SiteFields.name,
    SiteFields.streetAddress,
    SiteFields.city,
  ]), []);

  const siteList = useSelector((state) => {
    return selectSiteListByFields(state, siteSelectedFields);
  });

  const [listPage, setListPage] = useState(0);
  const [listCursor, setListCursor] = useState({});
  const siteListByPage = useMemo(() => (
    siteList.filter((_, index) => index < ListLimit * listPage)
  ), [siteList, listPage]);

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
    fields: siteSelectedFields.join(),
    latLngOrigin, latLngMin, latLngMax, limit,
  }), [siteSelectedFields, latLngOrigin, latLngMin, latLngMax, limit]);

  const { data, loadState } = useFetchData({
    condition: !mapParams.exist || mapIsZoomInLimit,
    action: useCallback(() => siteGetList(fetchParams), [fetchParams]),
  });

  const {
    data: dataOnScroll,
    loadState: loadStateOnScroll,
  } = useFetchDataOnScroll({
    action: useCallback(() => siteGetList({
      fields: siteSelectedFields.join(),
      latLngMin, latLngMax,
      limit: ListLimit,
      cursor: listCursor.next,
    }), [siteSelectedFields, latLngMin, latLngMax, listCursor.next]),
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
        {siteListByPage.length > 0
          ? (
            <>
              {
                siteListByPage.map(({ id, name, street_address, city }) => (
                  <CListGroupItem
                    key={id}
                    className="border rounded py-3 my-1 shadow-sm"
                    as="button"
                    onClick={() => handleViewSite(id)}
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
                  ? "No sites found"
                  : "Zoom in on map to display information"
                }
              </span>
            </div>
          )
        }

      </CListGroup>
    )
  );
};

export default SiteListView;
