import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "",
  name: "",
  message: "",
};

export const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    errorStateSet(state, { payload }) {
      const { status, name, message } = payload;
      state.status = status;
      state.name = name;
      state.message = message;
    },
    errorStateClear() {
      return initialState;
    },
  },
});

export const {
  errorStateSet,
  errorStateClear,
} = errorSlice.actions;

export const selectError = (state) => {
  return state[errorSlice.name];
};

export const selectErrorStatus = (state) => {
  return selectError(state).status;
};

export const selectErrorName = (state) => {
  return selectError(state).name;
};

export const selectErrorMessage = (state) => {
  return selectError(state).message;
};

export default errorSlice.reducer;
