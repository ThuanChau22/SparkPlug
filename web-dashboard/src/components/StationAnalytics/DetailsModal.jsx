import { useCallback, useEffect, useState } from "react";
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
import { apiInstance } from "redux/api";
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

  const [loading, setLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [chargeLevel, setChargeLevel] = useState("All");

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
      const params = [];
      if (startDate) params.push(`start_date=${formatDate(startDate)}`);
      if (endDate) params.push(`end_date=${formatDate(endDate)}`);
      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const analyticsRequestURL = `${StationAnalyticsAPI}/charts/${stationId}${query}`;
      const forecastRequestURL = `${EnergyForecastAPI}/${stationId}`;
      const headers = { Authorization: `Bearer ${token}` };
      const [analyticsResponse, forecastResponse] = await Promise.all([
        apiInstance.get(analyticsRequestURL, { headers }),
        apiInstance.get(forecastRequestURL, { headers }),
      ]);
      setAnalyticsData(analyticsResponse.data);
      setForecastData(forecastResponse.data);
    } catch (error) {
      console.log(error);
    }
  }, [StationAnalyticsAPI, EnergyForecastAPI, stationId, token, startDate, endDate]);

  useEffect(() => {
    fetchStationData();
    fetchAnalyticsData();
  }, [fetchStationData, fetchAnalyticsData]);

  const getEnergyConsumptionChartData = () => {
    if (!forecastData || !forecastData.data) return null;

    // Assuming forecastData contains both historical and predicted data
    const combinedData = forecastData.data.map(item => ({
      date: item.date,
      energy: item.energy,
      type: item.type
    }));

    // Sort the data by date
    const sortedData = combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extract labels (dates) and data (energy values)
    const labels = sortedData.map(item => item.date);
    const data = sortedData.map(item => item.energy);

    // Set color based on whether it's historical or predicted
    const backgroundColors = sortedData.map(item =>
      item.type === "historical" ? "rgba(75, 192, 192, 0.6)" : "rgba(255, 99, 132, 0.6)"
    );

    return {
      labels, // X-axis labels (dates)
      datasets: [
        {
          label: "Energy Consumption Forecast (kWh)",
          backgroundColor: backgroundColors, // Dynamic colors based on type
          data: data  // Combined energy data
        }
      ]
    };
  };

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
        {/*        
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
*/}
      </CForm>
      <CModalBody>
        {analyticsData
          ? (
            <>
              <CChart type="bar" data={analyticsData.revenue} />
              <CChart type="bar" data={analyticsData.peak_time} />
              <CChart type="bar" data={analyticsData.utilization_rate} />
              <CChart type="bar" data={analyticsData.sessions_count} />
              <CChart type="bar" data={analyticsData.energy_consumption} />
            </>
          )
          : (<LoadingIndicator />)
        }
        {forecastData
          ? (
            <>
              <div style={{ marginTop: "30px" }}>
                <CChart
                  type="bar"
                  data={getEnergyConsumptionChartData()}  // Combined forecast data (historical + predicted)
                  options={{
                    scales: {
                      x: {
                        stacked: false, // Ensure the datasets are not stacked
                      },
                      y: {
                        stacked: false
                      }
                    }
                  }}
                />
              </div>
            </>
          )
          : (<LoadingIndicator />)
        }
      </CModalBody>
    </CModal>
  );
};

export default StationAnalyticsDetailsModal;
