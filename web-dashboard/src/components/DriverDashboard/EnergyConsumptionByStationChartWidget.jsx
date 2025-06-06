import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { StationAnalyticsAPI } from "configs";
import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const DriverEnergyConsumptionByStationChartWidget = ({ className = "", style = {} }) => {
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
  }, [token, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return (
    <ChartWidgetContainer
      className={className}
      style={style}
      label="Energy Consumption by Station"
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

export default DriverEnergyConsumptionByStationChartWidget;
