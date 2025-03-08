import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import {
  CloseRounded,
  FilterAlt,
} from "@mui/icons-material";

import {
  filterDashboardStateClearOne,
  selectFilterDashboardList,
} from "redux/filter/dashboardSlice";

const FilterBar = ({ onClick, onRemove }) => {
  const filterList = useSelector(selectFilterDashboardList);  
  const dispatch = useDispatch();
  return (
    <CCard className="border-0 border-bottom">
      <CCardBody className="d-flex flex-row align-items-center py-2">
        <CButton
          className="d-flex"
          color="info"
          variant="outline"
          onClick={onClick}
        >
          <FilterAlt />
          Filters
        </CButton>
        <CListGroup className="d-flex overflow-auto ms-2" layout={"horizontal"}>
          {filterList.filter(({ text }) => text !== "").map(({ field, label, text, paths }) => (
            <CListGroupItem
              key={field}
              className="d-flex justify-content-between align-items-center border border-info rounded-pill me-2 py-1 px-2"
            >
              <p className="m-0 mx-1 text-info text-nowrap small">{label}: {text}</p>
              <CButton
                as={CloseRounded}
                className="p-0 rounded-circle text-info fs-5"
                onClick={() => dispatch(filterDashboardStateClearOne({ field, paths }))}
              />
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  );
};

export default FilterBar;
