import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const StationGrowthChartWidget = ({ filter = {}, className = "", style = {} }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const {
        interval,
        city, state, country,
        startDate: start_date,
        endDate: end_date,
        zipCode: postal,
      } = filter;
      const endpoint = `${StationAnalyticsAPI}/charts/station-growth`;
      const params = Object.entries({
        interval, start_date, end_date,
        city, state, country, postal,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${endpoint}${params ? `?${params}` : ""}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(query, { headers });
      setData(data);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [StationAnalyticsAPI, token, filter, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ChartWidgetContainer
      className={className}
      style={style}
      label="Stations"
      chart={{
        type: "bar",
        data: data,
        options: {
          indexAxis: "y",
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

export default StationGrowthChartWidget;
