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
      delay={500}
      minLength={1}
      filterBy={() => true}
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
