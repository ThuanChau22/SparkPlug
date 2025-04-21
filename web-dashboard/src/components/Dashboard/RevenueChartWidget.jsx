import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { StationAnalyticsAPI } from "api-endpoints";
import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, toUrlParams, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectFilterDashboardValues } from "redux/filter/dashboardSlice";

const RevenueChartWidget = ({ className = "", style = {} }) => {
  const token = useSelector(selectAuthAccessToken);
  const filter = useSelector(selectFilterDashboardValues);

  const resource = useMemo(() => (
    filter.viewBy === "station"
      ? "revenue-by-station"
      : "revenue-by-time-interval"
  ), [filter.viewBy]);

  const params = useMemo(() => toUrlParams({
    start_date: filter.startDate,
    end_date: filter.endDate,
    city: filter.city,
    state: filter.state,
    country: filter.country,
    postal: filter.zipCode,
    interval: filter.interval,
    order: filter.orderBy,
    count: filter.count,
  }), [filter]);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const endpoint = `${StationAnalyticsAPI}/charts`;
      const query = `${endpoint}/${resource}${params ? `?${params}` : ""}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(query, { headers });
      setData(data);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [resource, params, token, dispatch]);

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
