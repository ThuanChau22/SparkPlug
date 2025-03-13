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
} from "redux/station/stationSlice";

const StationAnalyticsDetailsModal = ({ isOpen, onClose, stationId }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const EnergyForecastAPI = process.env.REACT_APP_ENERGY_FORECAST_API_ENDPOINT;

  const station = useSelector((state) => selectStationById(state, stationId));
  const token = useSelector(selectAuthAccessToken);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [energyForecastData, setEnergyForecastData] = useState(null);

  // Default value for demo purpose
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
      const endpoint = `${StationAnalyticsAPI}/charts/all/${stationId}`;
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
  }, [StationAnalyticsAPI, stationId, startDate, endDate, token, dispatch]);

  const fetchEnergyForecastData = useCallback(async () => {
    try {
      const query = `${EnergyForecastAPI}/${stationId}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(query, { headers });
      setEnergyForecastData(data);
    } catch (error) {
      handleError({ error, dispatch });
      setEnergyForecastData({ data: [] });
    }
  }, [EnergyForecastAPI, stationId, token, dispatch]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchEnergyForecastData();
  }, [fetchAnalyticsData, fetchEnergyForecastData]);

  // Combined forecast data (historical + predicted)
  const energyConsumptionChartData = useMemo(() => {
    const chartData = {
      labels: [],
      datasets: [{
        label: "Energy Consumption Forecast (kWh)",
        data: [],
      }],
    };
    if (energyForecastData) {
      // Assuming forecastData contains both historical and predicted data
      const combinedData = energyForecastData.data.map(item => ({
        date: item.date,
        energy: item.energy,
        type: item.type
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Extract labels (dates) and data (energy values)
      chartData.labels = combinedData.map(({ date }) => date);
      const [dataset] = chartData.datasets;
      dataset.data = combinedData.map(({ energy }) => energy);

      // Set color based on whether historical or predicted data
      dataset.backgroundColor = combinedData.map(({ type }) =>
        type === "historical"
          ? "rgba(75, 192, 192, 0.6)"
          : "rgba(255, 99, 132, 0.6)"
      );
    }
    return chartData;
  }, [energyForecastData]);

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
        <CModalTitle>{!loadState.loading && station.name}</CModalTitle>
      </CModalHeader>
      <CForm className="d-flex align-item-center">
        <CInputGroup>
          <CInputGroupText className="rounded-0">
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
          <CInputGroupText className="rounded-0">
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
        {!analyticsData
          ? (<LoadingIndicator />)
          : (
            <>
              <CChart className="mt-3" type="bar" data={analyticsData.revenue} />
              <CChart className="mt-3" type="bar" data={analyticsData.peak_time} />
              <CChart className="mt-3" type="bar" data={analyticsData.utilization_rate} />
              <CChart className="mt-3" type="bar" data={analyticsData.sessions_count} />
              <CChart className="mt-3" type="bar" data={analyticsData.energy_consumption} />
            </>
          )
        }
        {!energyForecastData
          ? (<LoadingIndicator />)
          : (
            <CChart
              className="mt-3"
              type="bar"
              data={energyConsumptionChartData}
              options={{
                scales: {
                  x: {
                    stacked: false,
                  },
                  y: {
                    stacked: false,
                  }
                }
              }}
            />
          )
        }
      </CModalBody>
    </CModal>
  );
};

export default StationAnalyticsDetailsModal;
