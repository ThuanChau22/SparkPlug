import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CChart } from "@coreui/react-chartjs";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import { apiInstance } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import {
  stationGetById,
  selectStationById,
} from "redux/station/stationSlice";

const DriverStationDetailsModal = ({ isOpen, onClose, stationId }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;

  const station = useSelector((state) => selectStationById(state, stationId));
  const token = useSelector(selectAuthAccessToken);

  const [loading, setLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chargeLevel, setChargeLevel] = useState("All");

  const dispatch = useDispatch();

  const fetchStationData = useCallback(async () => {
    if (!station) {
      setLoading(true);
      await dispatch(stationGetById(stationId)).unwrap();
      setLoading(false);
    }
  }, [stationId, station, dispatch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    let month = "" + (date.getMonth() + 1);
    let day = "" + date.getDate();
    const year = date.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [month, day, year].join("/");
  };

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const base = `${StationAnalyticsAPI}/charts/${stationId}`;
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      if (chargeLevel !== "All") params.push(`charge_level=${chargeLevel}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${base}${query}`, { headers });
      setAnalyticsData(data);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, stationId, token, startDate, endDate, chargeLevel]);

  useEffect(() => {
    fetchStationData();
    fetchAnalyticsData();
  }, [fetchStationData, fetchAnalyticsData]);

  return (
    <CModal
      size="xl"
      alignment="center"
      backdrop="static"
      visible={isOpen}
      onClose={onClose}
      scrollable
    >
      <CModalHeader>
        <CModalTitle>{!loading && station.name}</CModalTitle>
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
        <CInputGroup>
          <CInputGroupText className="bg-secondary text-white rounded-0">
            Charge Level
          </CInputGroupText>
          <CFormSelect
            className="rounded-0 shadow-none"
            options={[
              { label: "All Levels", value: "All" },
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 3", value: "3" },
            ]}
            value={chargeLevel}
            onChange={(e) => setChargeLevel(e.target.value)}
          />
        </CInputGroup>
      </CForm>
      <CModalBody>
        {analyticsData
          ? (
            <CChart type="bar" data={analyticsData.peak_time} />
          )
          : (
            <LoadingIndicator />
          )}
      </CModalBody>
    </CModal>
  );
};

export default DriverStationDetailsModal;
