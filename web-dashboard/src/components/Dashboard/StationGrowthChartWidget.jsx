import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { StationAnalyticsAPI } from "configs";
import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, toUrlParams, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectFilterDashboardValues } from "redux/filter/dashboardSlice";

const StationGrowthChartWidget = ({ className = "", style = {} }) => {
  const token = useSelector(selectAuthAccessToken);
  const filter = useSelector(selectFilterDashboardValues);

  const params = useMemo(() => toUrlParams({
    start_date: filter.startDate,
    end_date: filter.endDate,
    city: filter.city,
    state: filter.state,
    country: filter.country,
    postal: filter.zipCode,
    interval: filter.interval,
  }), [filter]);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const endpoint = `${StationAnalyticsAPI}/charts/station-growth`;
      const query = `${endpoint}${params ? `?${params}` : ""}`;
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await apiInstance.get(query, { headers });
      setData(data);
    } catch (error) {
      handleError({ error, dispatch });
    }
  }, [params, token, dispatch]);

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
