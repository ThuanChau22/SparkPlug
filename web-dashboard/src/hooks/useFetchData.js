import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import useLoadState from "hooks/useLoadState";

const useFetchData = ({ action, condition = true, onLoad = true }) => {
  const [loadState, setLoadState] = useLoadState();

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (condition) {
      setLoadState.setLoading();
      setData(await dispatch(action()).unwrap());
      setLoadState.setDone();
    }
  }, [action, condition, setLoadState, dispatch]);

  useEffect(() => {
    if (onLoad) {
      fetchData();
    }
  }, [onLoad, fetchData]);

  return { data, loadState, fetchData };
}

export default useFetchData;
