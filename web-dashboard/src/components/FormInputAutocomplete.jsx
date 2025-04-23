import { useState } from "react";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";

import FormInput from "components/FormInput";

const FormInputAutocomplete = ({ id, onSearch, ...remain }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  return (
    <FormInput
      InputForm={AsyncTypeahead}
      id={id}
      filterBy={() => true}
      minLength={1}
      isLoading={loading}
      onSearch={async (query) => {
        setLoading(true);
        setOptions(await onSearch(query));
        setLoading(false);
      }}
      options={options}
      {...remain}
    />
  );
};

export default FormInputAutocomplete;
