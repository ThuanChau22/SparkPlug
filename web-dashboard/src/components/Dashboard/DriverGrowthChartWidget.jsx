import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { StationAnalyticsAPI } from "api-endpoints";
import ChartWidgetContainer from "components/ChartWidgetContainer";
import { apiInstance, toUrlParams, handleError } from "redux/api";
import { selectAuthAccessToken } from "redux/auth/authSlice";
import { selectFilterDashboardValues } from "redux/filter/dashboardSlice";

const DriverGrowthChartWidget = ({ className = "", style = {} }) => {
  const token = useSelector(selectAuthAccessToken);
  const filter = useSelector(selectFilterDashboardValues);

  const params = useMemo(() => toUrlParams({
    start_date: filter.startDate,
    end_date: filter.endDate,
    interval: filter.interval,
  }), [filter]);

  const [data, setData] = useState(null);

  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const endpoint = `${StationAnalyticsAPI}/charts/driver-growth`;
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
      label="Drivers"
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

export default DriverGrowthChartWidget;
