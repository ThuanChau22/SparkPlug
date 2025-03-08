import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  startDate: {
    label: "From",
    text: "1/1/2020", // For demo
    value: "2020-01-01", // For demo
  },
  endDate: {
    label: "To",
    text: "1/31/2020", // For demo
    value: "2020-01-31", // For demo
  },
  city: {
    label: "City",
    text: "",
    value: "",
  },
  state: {
    label: "State",
    text: "",
    value: "",
  },
  zipCode: {
    label: "Zip Code",
    text: "",
    value: "",
  },
  country: {
    label: "Country",
    text: "",
    value: "",
  },
  viewBy: {
    label: "View By",
    text: "",
    value: "",
    options: {
      interval: "Interval",
      station: "Station",
    },
    groups: {
      interval: {
        label: "Interval",
        text: "",
        value: "",
        options: {
          days: "Days",
          months: "Months",
          years: "Years",
        },
      },
      orderBy: {
        label: "Order By",
        text: "",
        value: "",
        options: {
          desc: "Descending",
          asc: "Ascending",
        },
      },
      count: {
        label: "Count",
        text: "",
        value: "",
      },
    },
  },
};

export const filterDashboardSlice = createSlice({
  name: "filter/dashboard",
  initialState,
  reducers: {
    filterDashboardStateSetAll(state, { payload }) {
      const setFields = (state, data) => {
        for (const [field, { groups }] of Object.entries(state)) {
          state[field].text = data[field]?.text;
          state[field].value = data[field]?.value;
          if (groups) {
            setFields(state[field].groups, data);
          }
        }
      };
      setFields(state, payload);
    },
    filterDashboardStateClearOne(state, { payload }) {
      const clearChildren = (state) => {
        for (const [field, { groups }] of Object.entries(state)) {
          state[field].text = "";
          state[field].value = "";
          if (groups) {
            clearChildren(state[field].groups);
          }
        }
      };
      const clearField = (state, paths) => {
        if (paths.length > 0) {
          const [field, ...remain] = paths;
          if (remain.length === 0) {
            state[field].text = "";
            state[field].value = "";
            clearChildren(state[field].groups || {});
          } else {
            clearField(state[field].groups, remain);
          }
        }
      };
      const { field, paths } = payload;
      clearField(state, [...paths, field]);
    },
    filterDashboardStateClearAll() {
      return initialState;
    },
  },
});

export const {
  filterDashboardStateSetAll,
  filterDashboardStateClearOne,
  filterDashboardStateClearAll,
} = filterDashboardSlice.actions;

export const selectFilterDashboard = (state) => state[filterDashboardSlice.name];

export const selectFilterDashboardList = createSelector(
  [selectFilterDashboard],
  (state) => {
    const toList = (data, paths = []) => {
      const list = [];
      for (const entry of Object.entries(data)) {
        const [field, { groups, ...remain }] = entry;
        list.push({ field, ...remain, paths });
        list.push(...(toList(groups || {}, [...paths, field])));
      }
      return list;
    };
    return toList(state);
  },
);

export const selectFilterDashboardEntities = createSelector(
  [selectFilterDashboardList],
  (list) => list.reduce((data, { field, ...remain }) => ({
    ...data, [field]: remain
  }), {}),
);

export const selectFilterDashboardValues = createSelector(
  [selectFilterDashboardList],
  (list) => list.reduce((data, { field, value }) => ({
    ...data, [field]: value
  }), {}),
);

export default filterDashboardSlice.reducer;
