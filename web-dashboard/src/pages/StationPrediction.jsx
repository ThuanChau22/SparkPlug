import { useCallback, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CButton,
} from "@coreui/react";

import {
  StationAPI,
  StationPredictionAPI,
} from "configs";
import MapContainer from "components/Map/MapContainer";
import MapFitBound from "components/Map/MapFitBound";
import StationPredictionMarkerCluster from "components/StationPrediction/MarkerCluster";
import StickyContainer from "components/StickyContainer";
import {
  apiInstance,
  toUrlParams,
  handleError,
} from "redux/api";
import {
  selectLayoutHeaderHeight,
  selectLayoutFooterHeight,
} from "redux/app/layoutSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const StationPrediction = () => {
  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const footerHeight = useSelector(selectLayoutFooterHeight);

  const token = useSelector(selectAuthAccessToken);

  const [loading, setLoading] = useState(false);

  const [inputHeight, setInputHeight] = useState(0);
  const inputRef = useCallback((node) => {
    setInputHeight(node?.getBoundingClientRect().height);
  }, []);

  const [input, setInput] = useState("");
  const [existedStationList, setExistedStationList] = useState([]);
  const [predictedStationList, setPredictedStationList] = useState([]);

  const dispatch = useDispatch();

  const mapRefHeight = useMemo(() => {
    return headerHeight + inputHeight + footerHeight;
  }, [headerHeight, inputHeight, footerHeight]);

  const stationList = useMemo(() => (
    existedStationList.concat(predictedStationList)
  ), [existedStationList, predictedStationList]);

  const fetchData = async (apiEndpoint) => {
    const endpoint = `${apiEndpoint}`;
    const params = toUrlParams({ zip_code: input });
    const query = `${endpoint}${params ? `?${params}` : ""}`;
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await apiInstance(query, { headers });
    return data;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const [{ data: existedStations }, newStations] = await Promise.all([
        fetchData(StationAPI),
        fetchData(StationPredictionAPI),
      ]);
      setExistedStationList(existedStations);
      setPredictedStationList(newStations);
    } catch (error) {
      handleError({ error, dispatch });
    }
    setLoading(false);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0">
        <StickyContainer style={{ top: `${headerHeight}px` }}>
          <div ref={inputRef} className="bg-body d-flex w-100">
            <CInputGroup>
              <CInputGroupText className="border-0 rounded-0">
                Zip Code
              </CInputGroupText>
              <CFormInput
                type="text"
                placeholder="Enter Zip Code"
                className="border-0 shadow-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </CInputGroup>
            <CButton
              className="border-0 rounded-0"
              variant="outline"
              color="info"
              onClick={handleSubmit}
              disabled={!input}
            >
              Predict
            </CButton>
          </div>
        </StickyContainer>
        <MapContainer
          loading={loading}
          refHeight={mapRefHeight}
        >
          <MapFitBound bounds={stationList} />
          <StationPredictionMarkerCluster stationList={stationList} />
        </MapContainer>
      </CCardBody>
    </CCard>
  );
};

export default StationPrediction;
