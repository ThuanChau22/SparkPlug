import { useCallback, useEffect, useMemo } from "react";
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
import useFetchData from "hooks/useFetchData";
import useStationEventSocket, { Action } from "hooks/useStationEventSocket";
import {
  selectAuthUserId,
  selectAuthRoleIsOwner,
} from "redux/auth/authSlice";
import {
  evseStateClear,
  evseGetList,
  selectEvseIds,
} from "redux/evse/evseSlice";
import {
  EvseStatus,
  evseStatusStateClear,
  evseStatusGetList,
  selectEvseStatusList,
} from "redux/evse/evseStatusSlice";

const EvseStatusWidget = ({ className = "" }) => {
  const authUserId = useSelector(selectAuthUserId);
  const authIsOwner = useSelector(selectAuthRoleIsOwner);

  const evseIds = useSelector(selectEvseIds);
  const evseStatusList = useSelector(selectEvseStatusList);

  const { loadState: evseLoadState } = useFetchData({
    condition: evseIds.length === 0,
    action: useCallback(() => evseGetList({
      ...(authIsOwner ? { ownerId: authUserId } : {}),
    }), [authIsOwner, authUserId]),
  });

  const { loadState: evseStatusLoadState } = useFetchData({
    condition: evseStatusList.length === 0,
    action: useCallback(() => evseStatusGetList({
      ...(authIsOwner ? { ownerId: authUserId } : {}),
    }), [authIsOwner, authUserId]),
  });

  const loading = useMemo(() => (
    evseLoadState.loading
    && evseStatusLoadState.loading
  ), [evseLoadState, evseStatusLoadState]);

  const stationIds = useMemo(() => (
    [...new Set(evseIds.map(({ station_id: id }) => id))]
  ), [evseIds]);

  useStationEventSocket({
    action: Action.WatchStatusEvent,
    payload: { stationIds },
  });

  const evseStatusData = useMemo(() => {
    const data = {
      Total: {
        label: "Total",
        color: "info",
        count: evseIds.length,
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
    if (data.Total.count > 0) {
      // Count of each status
      let presentCount = 0;
      for (const { status } of evseStatusList) {
        if (data[status]) {
          data[status].count++;
          presentCount++;
        }
      }
      // Count missing as Unavailable
      const absentCount = data.Total.count - presentCount;
      data[EvseStatus.Unavailable].count += absentCount;
      // Calculate percentage of each status
      for (const item of Object.values(data)) {
        item.percentage = (item.count / data.Total.count) * 100;
      }
    }
    return data;
  }, [evseIds, evseStatusList]);

  const dispatch = useDispatch();

  useEffect(() => () => {
    dispatch(evseStateClear());
    dispatch(evseStatusStateClear());
  }, [dispatch]);

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
