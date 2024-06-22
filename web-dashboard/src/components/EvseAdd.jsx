import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

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
        || !data.price) {
        return;
      }
      dispatch(evseAdd(data));
      setIsAdd(false);
    };

    return (
      <CForm>
        <label htmlFor="evseId">EVSE ID</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="evseId"
          name="evseId"
          type="number"
          min="1"
          placeholder="EVSE ID"
          value={formData.evseId}
          onChange={handleInputChange}
        />
        <label htmlFor="chargeLevel">Charge Level</label>
        <CFormSelect
          className="mb-3 shadow-none"
          id="chargeLevel"
          name="chargeLevel"
          value={formData.chargeLevel}
          onChange={handleInputChange}
          options={[
            { label: "Select Charge Level", value: "" },
            { label: "Level 1", value: "Level 1" },
            { label: "Level 2", value: "Level 2" },
            { label: "Level 3", value: "Level 3" },
          ]}
        />
        <label htmlFor="connectorType">Connector Type</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="connectorType"
          name="connectorType"
          type="text"
          placeholder="Connector Type"
          value={formData.connectorType}
          onChange={handleInputChange}
        />
        <label htmlFor="price">Price</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="price"
          name="price"
          type="number"
          min="0"
          placeholder="Price"
          value={formData.price}
          onChange={handleInputChange}
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
