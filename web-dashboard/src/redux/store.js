import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "redux/auth/authSlice";
import { userSlice } from "redux/user/userSlide";
import { siteSlice } from "redux/site/siteSlide";
import { stationSlice } from "redux/station/stationSlide";
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
    [errorSlice.name]: errorSlice.reducer,
  },
});
