import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CProgress,
} from "@coreui/react";

import LoadingIndicator from "components/LoadingIndicator";
import {
  EvseStatus,
  evseStatusGetList,
  selectEvseStatusList,
} from "redux/evse/evseStatusSlice";

const EvseStatusWidget = ({ className = "" }) => {
  const evseStatusList = useSelector(selectEvseStatusList);

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const fetchEvseStatus = useCallback(async () => {
    if (evseStatusList.length === 0) {
      setLoading(true);
      await dispatch(evseStatusGetList()).unwrap();
      setLoading(false);
    }
  }, [evseStatusList.length, dispatch]);

  useEffect(() => {
    fetchEvseStatus();
  }, [fetchEvseStatus]);

  const evseStatusData = useMemo(() => {
    const data = {
      Total: {
        label: "Total",
        color: "info",
        count: evseStatusList.length,
        percentage: 0,
      },
      [EvseStatus.Available]: {
        label: "Available",
        color: "success",
        count: 0,
        percentage: 0,
      },
      [EvseStatus.Occupied]: {
        label: "In Use",
        color: "warning",
        count: 0,
        percentage: 0,
      },
      [EvseStatus.Faulted]: {
        label: "Out of Service",
        color: "danger",
        count: 0,
        percentage: 0,
      },
      [EvseStatus.Unavailable]: {
        label: "Unavailable",
        color: "secondary",
        count: 0,
        percentage: 0,
      },
    };
    // Count of each status
    for (const { status } of evseStatusList) {
      if (data[status]) {
        data[status].count++;
      }
    }
    // Calculate percentage of each status
    for (const item of Object.values(data)) {
      if (data.Total.count !== 0) {
        item.percentage = (item.count / data.Total.count) * 100;
      }
    }
    return data;
  }, [evseStatusList]);

  return (
    <CCard className={className}>
      <CCardBody>
        <CCardTitle as="div" className="fs-4 fw-semibold">
          Charger Status
        </CCardTitle>
        {loading
          ? <LoadingIndicator size={60} loading={loading} />
          : (
            <CRow
              className="d-flex justify-content-evenly mb-1"
              xs={{ cols: 1, gutter: 2 }}
            >
              {Object.values(evseStatusData).map(({ label, color, count, percentage }) => (
                <CCol key={label} sm={label === evseStatusData.Total.label ? 12 : 6} md={2}>
                  <div className="fw-semibold text-center mb-2">
                    <span className={`d-block text-${color}`}>{label}</span>
                    <span className="d-block">{count} ({percentage.toFixed(2)}%)</span>
                  </div>
                  <CProgress height={6} color={color} value={percentage} />
                </CCol>
              ))}
            </CRow>
          )
        }
      </CCardBody>
    </CCard>
  );
}

export default EvseStatusWidget;
