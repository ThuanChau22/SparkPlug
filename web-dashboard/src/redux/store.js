import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "redux/auth/authSlice";
import { sidebarSlice } from "redux/sidebar/sidebarSlice";
import { headerSlice } from "redux/header/headerSlice";
import { errorSlice } from "redux/error/errorSlice";

export const store = configureStore({
  reducer: {
    [authSlice.name]: authSlice.reducer,
    [headerSlice.name]: headerSlice.reducer,
    [sidebarSlice.name]: sidebarSlice.reducer,
    [errorSlice.name]: errorSlice.reducer,
  },
});
