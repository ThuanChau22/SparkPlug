import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CProgress,
} from "@coreui/react";
import ms from "ms";

import LoadingIndicator from "components/LoadingIndicator";
import useBatchUpdate from "hooks/useBatchUpdate";
import useFetchData from "hooks/useFetchData";
import useStationEventSocket from "hooks/useStationEventSocket";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  evseGetCount,
} from "redux/evse/evseSlice";
import {
  EvseStatus,
  evseStatusGetCount,
} from "redux/evse/evseStatusSlice";

const EvseStatusWidget = ({ className = "" }) => {
  const authUserId = useSelector(selectAuthUserId);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const [refresh, setRefresh] = useState(true);

  const {
    data: evseCount,
    loadState: evseLoadState,
  } = useFetchData({
    action: useCallback(() => evseGetCount({
      ...(authIsOwner ? { ownerId: authUserId } : {}),
    }), [authIsOwner, authUserId]),
  });

  const {
    data: evseStatusCount,
    loadState: evseStatusLoadState,
  } = useFetchData({
    condition: refresh,
    action: useCallback(() => evseStatusGetCount({
      ...(authIsOwner ? { ownerId: authUserId } : {}),
    }), [authIsOwner, authUserId]),
  });

  const [updates, setUpdateTimeout] = useBatchUpdate({
    callback: useCallback(() => setRefresh(true), []),
    delay: ms("5s"),
  });

  const { watchStatusEvent } = useStationEventSocket({
    onWatchStatusEvent: useCallback(() => {
      if (updates.current.length === 0) {
        updates.current.push(true);
      }
    }, [updates]),
  });

  useEffect(() => {
    watchStatusEvent();
  }, [watchStatusEvent]);

  useEffect(() => {
    if (evseStatusCount) {
      setRefresh(false);
      setUpdateTimeout();
    }
  }, [evseStatusCount, setUpdateTimeout]);

  const evseStatusData = useMemo(() => {
    const data = {
      Total: {
        label: "Total",
        color: "info",
        count: 0,
      },
      [EvseStatus.Available]: {
        label: "Available",
        color: "success",
        count: 0,
      },
      [EvseStatus.Occupied]: {
        label: "In Use",
        color: "warning",
        count: 0,
      },
      [EvseStatus.Faulted]: {
        label: "Out of Service",
        color: "danger",
        count: 0,
      },
      [EvseStatus.Unavailable]: {
        label: "Unavailable",
        color: "secondary",
        count: 0,
      },
    };
    if (evseCount && evseStatusCount) {
      // Set total count
      data.Total.count = evseCount;
      // Count of each status
      let presentCount = 0;
      for (const { status, count } of evseStatusCount) {
        if (data[status]) {
          data[status].count = count;
          presentCount += count;
        }
      }
      // Count missing as Unavailable
      const absentCount = data.Total.count - presentCount;
      data[EvseStatus.Unavailable].count += absentCount;
    }
    return data;
  }, [evseCount, evseStatusCount]);

  const loading = useMemo(() => (
    evseLoadState.loading && evseStatusLoadState.loading
  ), [evseLoadState, evseStatusLoadState]);

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
              {Object.values(evseStatusData).map(({ label, color, count }) => {
                const { count: totalCount } = evseStatusData.Total;
                const percentage = totalCount ? (count / totalCount) * 100 : 0;
                return (
                  <CCol key={label} sm={label === evseStatusData.Total.label ? 12 : 6} md={2}>
                    <div className="fw-semibold text-center mb-2">
                      <span className={`d-block text-${color}`}>{label}</span>
                      <span className="d-block">{count} ({percentage.toFixed(2)}%)</span>
                    </div>
                    <CProgress height={6} color={color} value={percentage} />
                  </CCol>
                );
              })}
            </CRow>
          )
        }
      </CCardBody>
    </CCard>
  );
}

export default EvseStatusWidget;
