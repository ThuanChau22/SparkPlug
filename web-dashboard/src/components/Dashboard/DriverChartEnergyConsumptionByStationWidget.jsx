import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const DriverChartEnergyConsumptionByStationWidget = ({ className = "", style = {} }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const baseURL = `${StationAnalyticsAPI}/charts/driver-energy-consumption-by-station`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(`${baseURL}`, { headers });
      setData(data);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [StationAnalyticsAPI, token, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return (
    <ChartWidgetContainer
      className={className}
      style={style}
      label="Driver Energy Consumption by Station"
      chart={{
        type: "bar",
        data: data,
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: {
                drawTicks: false,
              },
            },
            y: {
              grid: {
                drawTicks: false,
              },
            },
          },
        },
      }}
    />
  );
}

export default DriverChartEnergyConsumptionByStationWidget;