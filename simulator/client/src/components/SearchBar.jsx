import { useState } from "react";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import {
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";
import { Search } from "@mui/icons-material";
import "react-bootstrap-typeahead/css/Typeahead.css";

const SearchBar = ({ id, value, onSearch, ...remain }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  return (
    <CInputGroup className="w-auto">
      <CInputGroupText className="border border-primary">
        <Search style={{ color: `${value ? "var(--cui-info)" : ""}` }} />
      </CInputGroupText>
      <AsyncTypeahead
        className="border border-primary rounded-end shadow-none"
        id={id}
        delay={500}
        minLength={1}
        filterBy={() => true}
        isLoading={loading}
        defaultInputValue={value || ""}
        onSearch={async (query) => {
          setLoading(true);
          setOptions(await onSearch(query));
          setLoading(false);
        }}
        options={options}
        {...remain}
      />
    </CInputGroup>
  );
};

export default SearchBar;
