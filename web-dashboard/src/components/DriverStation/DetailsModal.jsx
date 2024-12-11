import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CChart } from "@coreui/react-chartjs";
import {
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById
} from "redux/station/stationSlice";

const DriverStationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;

  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));
  const token = useSelector(selectAuthAccessToken);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2020-12-31");

  const { loadState } = useFetchData({
    condition: !station?.name,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  const dispatch = useDispatch();

  const apiConfig = useMemo(() => {
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [token]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const endpoint = `${StationAnalyticsAPI}/charts/peak-time/${stationId}`;
      const params = Object.entries({
        start_date: startDate,
        end_date: endDate,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${endpoint}${params ? `?${params}` : ""}`;
      const { data } = await apiInstance.get(query, apiConfig);
      setAnalyticsData(data);
    } catch (error) {
      handleError({ error, dispatch });
      console.log(error);
    }
  }, [StationAnalyticsAPI, stationId, startDate, endDate, apiConfig, dispatch]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return (
    <CModal
      size="lg"
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader>
        <CModalTitle>
          {!loadState.loading && (
            <>
              <span>{station.name} - </span>
              <span className="fw-medium">
                <EvseAvailabilityStatus
                  status={stationStatus}
                />
              </span>
            </>
          )}
        </CModalTitle>
      </CModalHeader>
      <CForm className="d-flex align-item-center">
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            From
          </CInputGroupText>
          <CFormInput
            className="rounded-0 shadow-none"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CInputGroup>
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            To
          </CInputGroupText>
          <CFormInput
            className="rounded-0 shadow-none"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CInputGroup>
      </CForm>
      <CModalBody>
        {analyticsData
          ? (
            <CChart type="bar" data={analyticsData} />
          )
          : (
            <LoadingIndicator />
          )}
      </CModalBody>
    </CModal>
  );
};

export default DriverStationDetailsModal;
