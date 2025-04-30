import { Search } from "@mui/icons-material";

import FormInputAutocomplete from "components/FormInputAutocomplete";
import useSearchParam from "hooks/useSearchParam";
import { siteLocationAutocomplete } from "redux/site/siteSlice";
import { useDispatch } from "react-redux";

const SearchBar = (props) => {
  const [search, setSearch] = useSearchParam();

  const dispatch = useDispatch();

  const handleLocationAutocomplete = async (input) => {
    const locations = await dispatch(siteLocationAutocomplete({
      name: input,
      streetAddress: input,
      city: input,
      state: input,
      zipCode: input,
      country: input,
      limit: 5,
    })).unwrap();
    return locations.map((location) => {
      const { name, street_address, city } = location;
      const { state, zip_code, country } = location;
      const label = [
        name, street_address, city,
        state, zip_code, country,
      ].filter((e) => e).join(", ");
      return { label, value: label }
    });
  };

  const handleOnChange = (selected) => {
    if (selected) {
      setSearch(selected.value);
    }
  };

  return (
    <FormInputAutocomplete
      id="location-input-autocomplete"
      icon={<Search style={{ color: `${search ? "var(--cui-info)" : ""}` }} />}
      defaultInputValue={search || ""}
      onSearch={(input) => handleLocationAutocomplete(input)}
      onChange={([selected]) => handleOnChange(selected)}
      {...props}
    />
  );
};

export default SearchBar;
