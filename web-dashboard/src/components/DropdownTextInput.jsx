import {
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalHeader,
  CModalBody,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";

import FormInput from "components/FormInput";
import { useState } from "react";

const DropdownTextInput = ({ value, onChange }) => {
  const [options, setOptions] = useState([]);
  return (
    <div className="position-relative">
      <FormInput
        InputForm={CFormInput}
        label="City"
        name="city"
        type="text"
        placeholder="Enter city"
        value={value}
        onChange={onChange}
      />
      <CDropdown
        visible={options.length !== 0}
        className="position-absolute"
        style={{ top: "", width: "100%" }}
      >
        <CDropdownMenu style={{ width: "100%" }}>
          {options.map((option) => (
            <CDropdownItem as="div">{option}</CDropdownItem>
          ))}
        </CDropdownMenu>
      </CDropdown>
    </div>
  );
};

export default DropdownTextInput;
