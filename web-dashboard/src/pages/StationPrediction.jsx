import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CCard,
  CCardBody,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CButton,
} from "@coreui/react";

import { newStationIcon } from "assets/mapIcons";
import LoadingIndicator from "components/LoadingIndicator";
import MapContainer from "components/MapContainer";
import MapMarker from "components/MapMarker";
import StationMarker from "components/StationMarker";
import StickyContainer from "components/StickyContainer";
import {
  apiInstance,
  handleError,
} from "redux/api";
import {
  selectLayoutHeaderHeight,
  selectLayoutFooterHeight,
} from "redux/layout/layoutSlice";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const StationPrediction = () => {
  const StationAPI = process.env.REACT_APP_STATION_API_ENDPOINT;
  const StationPredictionAPI = process.env.REACT_APP_STATION_PREDICTION_ENDPOINT;

  const inputRef = useRef({});

  const headerHeight = useSelector(selectLayoutHeaderHeight);
  const footerHeight = useSelector(selectLayoutFooterHeight);

  const token = useSelector(selectAuthAccessToken);

  const [mapHeight, setMapHeight] = useState(window.innerHeight);

  const [loading, setLoading] = useState(false);

  const [input, setInput] = useState("");
  const [existedStationList, setExistedStationList] = useState([]);
  const [newStationList, setNewStationList] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const filterHeight = inputRef.current.offsetHeight;
    setMapHeight(window.innerHeight - (headerHeight + filterHeight + footerHeight));
  }, [headerHeight, footerHeight, inputRef]);

  const positions = useMemo(() => {
    const list = [...existedStationList, ...newStationList];
    return list.map(({ latitude, longitude }) => [latitude, longitude]);
  }, [existedStationList, newStationList]);

  const fetchData = async (apiEndpoint) => {
    const base = `${apiEndpoint}`;
    const zipCode = parseInt(input);
    const query = `?zip_code=${zipCode}`;
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await apiInstance(`${base}${query}`, { headers });
    return data;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const [existedStations, newStations] = await Promise.all([
        fetchData(StationAPI),
        fetchData(StationPredictionAPI),
      ]);
      setExistedStationList(existedStations);
      setNewStationList(newStations);
    } catch (error) {
      handleError({ error, dispatch });
    }
    setLoading(false);
  };

  return (
    <CCard className="flex-grow-1 border border-0 rounded-0">
      <CCardBody className="d-flex flex-column h-100 p-0">
        <StickyContainer style={{ top: `${headerHeight}px` }}>
          <div
            className="d-flex w-100"
            style={{ backgroundColor: "var(--cui-body-bg)" }}
            ref={inputRef}
          >
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
        <div style={{ height: `${mapHeight}px` }}>
          {loading
            ? <LoadingIndicator loading={loading} />
            : (
              <MapContainer positions={positions}>
                {existedStationList.map((station) => (
                  <StationMarker
                    key={station.id}
                    station={station}
                  />
                ))}
                {newStationList.map(({ latitude, longitude }) => (
                  <MapMarker
                    key={`${latitude},${longitude}`}
                    icon={newStationIcon}
                    position={[latitude, longitude]}
                  >
                    <div>{latitude}, {longitude}</div>
                  </MapMarker>
                ))}
              </MapContainer>
            )
          }
        </div>
      </CCardBody>
    </CCard>
  );
};

export default StationPrediction;
