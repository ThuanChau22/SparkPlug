import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardBody,
} from "@coreui/react";
import {
  CloseRounded,
  FilterAlt,
} from "@mui/icons-material";

import MuliItemCarousel from "components/MultiItemCarousel";
import {
  filterDashboardStateClearOne,
  selectFilterDashboardList,
} from "redux/filter/dashboardSlice";

const FilterBar = ({ onClick }) => {
  const filterList = useSelector(selectFilterDashboardList);
  const dispatch = useDispatch();
  return (
    <CCard className="border-0 border-bottom">
      <CCardBody className="d-flex flex-row align-items-center py-2">
        <CButton
          className="d-flex py-2"
          color="info"
          variant="outline"
          onClick={onClick}
        >
          <FilterAlt />
          <span>Filters</span>
          <span className="d-sm-none bg-info text-body fw-bold rounded-circle ms-1 px-2">
            {`${filterList.filter(({ text }) => text !== "").length}`}
          </span>
        </CButton>
        {filterList.length > 0 && (
          <MuliItemCarousel className="ms-2">
            {filterList.filter(({ text }) => text !== "").map(({ field, label, text, paths }) => (
              <div
                key={field}
                className="d-flex justify-content-between align-items-center border border-info rounded-pill me-3 p-2"
              >
                <p className="m-0 mx-1 text-info text-truncate small">{label}: {text}</p>
                <CButton
                  as={CloseRounded}
                  className="p-0 rounded-circle text-info fs-5"
                  onClick={() => dispatch(filterDashboardStateClearOne({ field, paths }))}
                />
              </div>
            ))}
          </MuliItemCarousel>
        )}
      </CCardBody>
    </CCard>
  );
};

export default FilterBar;
