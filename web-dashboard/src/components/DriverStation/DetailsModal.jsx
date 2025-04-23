import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { CChart } from "@coreui/react-chartjs";

import { StationAnalyticsAPI } from "configs";
import EvseAvailabilityStatus from "components/EvseAvailabilityStatus";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import useMapZoom from "hooks/useMapZoom";
import {
  apiInstance,
  toUrlParams,
  handleError,
} from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
  selectStationStatusById
} from "redux/station/stationSlice";

const DriverStationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const station = useSelector((state) => selectStationById(state, stationId));
  const stationStatus = useSelector((state) => selectStationStatusById(state, stationId));
  const token = useSelector(selectAuthAccessToken);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2020-12-31");

  const fetchOnLoad = useMemo(() => {
    const { name, latitude, longitude } = station || {};
    return !name || !latitude || !longitude;
  }, [station]);

  const { loadState } = useFetchData({
    condition: fetchOnLoad,
    action: useCallback(() => stationGetById(stationId), [stationId]),
  });

  useMapZoom({
    lat: station.latitude,
    lng: station.longitude,
  });

  const dispatch = useDispatch();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const endpoint = `${StationAnalyticsAPI}/charts/peak-time/${stationId}`;
      const params = toUrlParams({
        start_date: startDate,
        end_date: endDate,
      });
      const query = `${endpoint}${params ? `?${params}` : ""}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(query, { headers });
      setAnalyticsData(data);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [stationId, startDate, endDate, token, dispatch]);

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
