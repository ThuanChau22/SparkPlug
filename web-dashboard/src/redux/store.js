import { configureStore } from "@reduxjs/toolkit";

import { layoutSlice } from "redux/layout/layoutSlice";
import { filterDashboardSlice } from "redux/filter/dashboardSlice";
import { mapSlice } from "redux/map/mapSlice";
import { authSlice } from "redux/auth/authSlice";
import { userSlice } from "redux/user/userSlice";
import { siteSlice } from "redux/site/siteSlice";
import { stationSlice } from "redux/station/stationSlice";
import { stationEventSlice } from "redux/station/stationEventSlice";
import { evseSlice } from "redux/evse/evseSlice";
import { evseStatusSlice } from "redux/evse/evseStatusSlice";
import { errorSlice } from "redux/error/errorSlice";


export const store = configureStore({
  reducer: {
    [layoutSlice.name]: layoutSlice.reducer,
    [filterDashboardSlice.name]: filterDashboardSlice.reducer,
    [mapSlice.name]: mapSlice.reducer,
    [authSlice.name]: authSlice.reducer,
    [siteSlice.name]: siteSlice.reducer,
    [stationSlice.name]: stationSlice.reducer,
    [stationEventSlice.name]: stationEventSlice.reducer,
    [evseSlice.name]: evseSlice.reducer,
    [evseStatusSlice.name]: evseStatusSlice.reducer,
    [userSlice.name]: userSlice.reducer,
    [errorSlice.name]: errorSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false,
  }),
});
