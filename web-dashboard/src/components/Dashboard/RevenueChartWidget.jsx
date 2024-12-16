import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";

const RevenueChartWidget = ({ filter = {}, className = "", style = {} }) => {
  const StationAnalyticsAPI = process.env.REACT_APP_ANALYTICS_STATION_API_ENDPOINT;
  const token = useSelector(selectAuthAccessToken);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const {
        viewBy,
        city, state, country,
        order, count,
        startDate: start_date,
        endDate: end_date,
        zipCode: postal,
      } = filter;
      const endpoint = `${StationAnalyticsAPI}/charts`;
      const resource = viewBy === "station"
        ? "revenue-by-station"
        : "revenue-by-time-interval";
      const params = Object.entries({
        start_date, end_date,
        city, state, country, postal,
        order, count,
      }).map(([key, value]) => value ? `${key}=${value}` : "")
        .filter((param) => param).join("&");
      const query = `${endpoint}/${resource}${params ? `?${params}` : ""}`;
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
      label="Revenue"
      chart={{
        type: "line",
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
          elements: {
            line: {
              borderWidth: 2,
              tension: 0.3,
            },
            point: {
              hitRadius: 10,
            },
          },
        },
      }}
    />
  );
}

export default RevenueChartWidget;
