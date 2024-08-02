import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "redux/auth/authSlice";
import { userSlice } from "redux/user/userSlice";
import { siteSlice } from "redux/site/siteSlice";
import { stationSlice } from "redux/station/stationSlice";
import { stationEventSlice } from "redux/station/stationEventSlice";
import { evseSlice } from "redux/evse/evseSlice";
import { evseStatusSlice } from "./evse/evseStatusSlice";
import { sidebarSlice } from "redux/sidebar/sidebarSlice";
import { headerSlice } from "redux/header/headerSlice";
import { errorSlice } from "redux/error/errorSlice";

export const store = configureStore({
  reducer: {
    [headerSlice.name]: headerSlice.reducer,
    [sidebarSlice.name]: sidebarSlice.reducer,
    [authSlice.name]: authSlice.reducer,
    [userSlice.name]: userSlice.reducer,
    [siteSlice.name]: siteSlice.reducer,
    [stationSlice.name]: stationSlice.reducer,
    [stationEventSlice.name]: stationEventSlice.reducer,
    [evseSlice.name]: evseSlice.reducer,
    [evseStatusSlice.name]: evseStatusSlice.reducer,
    [errorSlice.name]: errorSlice.reducer,
  },
});
