import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import FormInput from "components/FormInput";
import { evseAdd } from "redux/evse/evseSlice";

const EvseAdd = ({ stationId }) => {
  const [isAdd, setIsAdd] = useState(false);
  const dispatch = useDispatch();

  const AddForm = () => {
    const initialFormData = {
      evseId: "",
      chargeLevel: "",
      connectorType: "",
      price: "",
    };
    const [formData, setFormData] = useState(initialFormData);
    const [validated, setValidated] = useState(false);

    const handleInputChange = ({ target }) => {
      const { name, value } = target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = () => {
      const data = {
        ...formData,
        stationId,
      };
      if (!data.evseId
        || !data.chargeLevel
        || !data.connectorType
        || !data.price
      ) {
        setValidated(true);
        return;
      }
      dispatch(evseAdd(data));
      setIsAdd(false);
    };

    return (
      <CForm className="mt-3" noValidate validated={validated}>
        <FormInput
          InputForm={CFormInput}
          name="evseId"
          type="number"
          min="1"
          placeholder="EVSE ID"
          value={formData.evseId}
          onChange={handleInputChange}
          feedbackInvalid="Please provide EVSE ID"
          required
        />
        <FormInput
          InputForm={CFormSelect}
          name="chargeLevel"
          options={[
            { label: "Select Charge Level", value: "", disabled: true },
            { label: "Level 1", value: "Level 1" },
            { label: "Level 2", value: "Level 2" },
            { label: "Level 3", value: "Level 3" },
          ]}
          value={formData.chargeLevel}
          onChange={handleInputChange}
          feedbackInvalid="Please provide charge level"
          required
        />
        <FormInput
          InputForm={CFormInput}
          name="connectorType"
          type="text"
          placeholder="Connector Type"
          value={formData.connectorType}
          onChange={handleInputChange}
          feedbackInvalid="Please provide connector type"
          required
        />
        <FormInput
          InputForm={CFormInput}
          name="price"
          type="number"
          min="0"
          placeholder="Price"
          value={formData.price}
          onChange={handleInputChange}
          feedbackInvalid="Please provide price"
          required
        />
        <CButton
          variant="outline"
          color="info"
          onClick={handleSubmit}
        >
          Add EVSE
        </CButton>
        <CButton
          className="ms-2"
          variant="outline"
          color="secondary"
          onClick={() => setIsAdd(false)}
        >
          Cancel
        </CButton>
      </CForm>
    )
  };

  return (
    <>
      {isAdd
        ? <AddForm />
        : <CButton
          className="w-100"
          variant="outline"
          color="info"
          onClick={() => setIsAdd(true)}
        >
          Add EVSE
        </CButton>
      }

    </>
  );
};

export default EvseAdd;
