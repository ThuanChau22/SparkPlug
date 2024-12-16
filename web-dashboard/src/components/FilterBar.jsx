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

const FilterBar = ({ filter = {}, onClick, onRemove }) => {
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
          Filter
        </CButton>
        <CListGroup className="d-flex overflow-auto ms-3" layout={"horizontal"}>
          {Object.entries(filter).filter(([_, value]) => value).map(([field, value]) => (
            <CListGroupItem
              key={field}
              className="d-flex flex-fill justify-content-between align-items-center border border-info rounded-pill me-2 py-1 px-2"
            >
              <p className="text-info ms-1 me-2 mb-0 small text-nowrap">{field}: {value}</p>
              <CloseRounded
                color="info"
                fontSize="small"
                onClick={() => onRemove(field)}
              />
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  );
};

export default FilterBar;
