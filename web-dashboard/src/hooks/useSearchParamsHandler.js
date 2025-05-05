import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import useMapParam from "hooks/useMapParam";
import useViewParam from "hooks/useViewParam";
import useSearchParam from "hooks/useSearchParam";
import {
  LayoutView,
  selectLayoutMobile,
  selectLayoutView,
} from "redux/app/layoutSlice";
import {
  searchParamsStateSetMap,
  searchParamsStateSetView,
  searchParamsStateSetSearch,
  selectSearchParams,
} from "redux/app/searchParamsSlice";

const useSearchParamsHandler = () => {
  const [_, setSearchParams] = useSearchParams();

  const isMobile = useSelector(selectLayoutMobile);
  const layoutView = useSelector(selectLayoutView);

  const searchParams = useSelector(selectSearchParams);

  const [mapParam] = useMapParam();
  const [viewParam] = useViewParam();
  const [searchParam] = useSearchParam();

  const isMobileListView = useMemo(() => (
    isMobile && viewParam === LayoutView.List
  ), [isMobile, viewParam]);

  const [initParams, setInitParams] = useState({
    map: mapParam,
    view: viewParam,
    search: searchParam,
  });

  const dispatch = useDispatch();

  const syncSearchParams = useCallback(() => {
    const paramValues = Object.values(initParams);
    if (paramValues.filter((e) => e).length !== 0) {
      const { map, view, search } = initParams;
      if (map) {
        const [lat, lng, z] = map.split(",");
        dispatch(searchParamsStateSetMap({ lat, lng, z }));
      }
      if (view) {
        dispatch(searchParamsStateSetView(view));
      }
      if (search) {
        dispatch(searchParamsStateSetSearch(search));
      }
      setInitParams({});
    } else {
      setSearchParams((params) => {
        const entries = Object.entries(searchParams);
        for (const [key, value] of entries) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
        return params;
      });
    }
  }, [setSearchParams, initParams, searchParams, dispatch]);

  const clearSearchOnMap = useCallback(() => {
    if (mapParam) {
      dispatch(searchParamsStateSetSearch(""));
    }
  }, [mapParam, dispatch]);

  const setViewOnMobile = useCallback(() => {
    if (isMobile) {
      dispatch(searchParamsStateSetView(layoutView));
    }
  }, [isMobile, layoutView, dispatch]);

  const clearMapOnSearchInMobileListView = useCallback(() => {
    if (searchParam && isMobileListView) {
      dispatch(searchParamsStateSetMap({}));
    }
  }, [searchParam, isMobileListView, dispatch]);

  return {
    syncSearchParams,
    clearSearchOnMap,
    setViewOnMobile,
    clearMapOnSearchInMobileListView,
  }
};

export default useSearchParamsHandler;
