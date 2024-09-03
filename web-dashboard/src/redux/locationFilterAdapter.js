import { createDraftSafeSelector } from "@reduxjs/toolkit";

export const createLocationFilterAdapter = () => ({

  getInitialState: (state) => {
    const { filters, ...extraState } = state || {};
    return {
      filters: {
        state: {
          selected: "All",
          options: ["All"],
        },
        city: {
          selected: "All",
          options: ["All"],
        },
        zipCode: {
          selected: "All",
          options: ["All"],
        },
      },
      ...extraState,
    };
  },

  setStateSelected: (state, selected) => {
    state.filters.state.selected = selected;
  },

  setStateOptions: (state, data) => {
    const set = new Set(data.map(({ state }) => state));
    const sorter = (a, b) => a.localeCompare(b);
    state.filters.state.options = ["All", ...Array.from(set).sort(sorter)];
  },

  setCitySelected: (state, selected) => {
    state.filters.city.selected = selected;
  },

  setCityOptions: (state, data) => {
    const set = new Set(data.map(({ city }) => city));
    const sorter = (a, b) => a.localeCompare(b);
    state.filters.city.options = ["All", ...Array.from(set).sort(sorter)];
  },

  setZipCodeSelected: (state, selected) => {
    state.filters.zipCode.selected = selected;
  },

  setZipCodeOptions: (state, data) => {
    const set = new Set(data.map(({ zip_code }) => zip_code));
    const sorter = (a, b) => a - b;
    state.filters.zipCode.options = ["All", ...Array.from(set).sort(sorter)];
  },

  getSelectors: (selectState) => {
    const selectAll = createDraftSafeSelector(
      selectState,
      (state) => state.filters,
    );
    const selectSelectedState = createDraftSafeSelector(
      selectState,
      (state) => state.filters.state.selected,
    );
    const selectStateOptions = createDraftSafeSelector(
      selectState,
      (state) => state.filters.state.options,
    );
    const selectSelectedCity = createDraftSafeSelector(
      selectState,
      (state) => state.filters.city.selected,
    );
    const selectCityOptions = createDraftSafeSelector(
      selectState,
      (state) => state.filters.city.options,
    );
    const selectSelectedZipCode = createDraftSafeSelector(
      selectState,
      (state) => state.filters.zipCode.selected,
    );
    const selectZipCodeOptions = createDraftSafeSelector(
      selectState,
      (state) => state.filters.zipCode.options,
    );
    return {
      selectAll: (state) => selectAll(state),
      selectSelectedState: (state) => selectSelectedState(state),
      selectStateOptions: (state) => selectStateOptions(state),
      selectSelectedCity: (state) => selectSelectedCity(state),
      selectCityOptions: (state) => selectCityOptions(state),
      selectSelectedZipCode: (state) => selectSelectedZipCode(state),
      selectZipCodeOptions: (state) => selectZipCodeOptions(state),
    };
  },

});
