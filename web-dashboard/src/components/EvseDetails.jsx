import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import {
  evseUpdateById,
  evseDeleteById,
  selectEvseById,
} from "redux/evse/evseSlice";

const EvseDetails = ({ stationId, evseId }) => {
  const id = { stationId, evseId };
  const evse = useSelector((state) => selectEvseById(state, id));
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const dispatch = useDispatch();

  const Info = () => {
    const { evse_id, charge_level, connector_type, price } = evse;
    const formatPrice = (price) => {
      const options = { style: 'currency', currency: 'USD' };
      return new Intl.NumberFormat('en-US', options).format(price);
    };
    return (
      <>
        <div className="d-flex justify-content-between">
          <small className="text-secondary my-auto">EVSE ID: {evse_id}</small>
          <div>
            <CButton
              className="me-2"
              variant="outline"
              color="warning"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </CButton>
            <CButton
              variant="outline"
              color="danger"
              onClick={() => setIsDelete(true)}
            >
              Delete
            </CButton>
          </div>
        </div>
        <p>Charge Level: {charge_level}</p>
        <p>Connector Type: {connector_type}</p>
        <p>Price: {formatPrice(price)}</p>
      </>
    );
  };

  const Edit = () => {
    const initialFormData = {
      chargeLevel: "",
      connectorType: "",
      price: "",
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
      if (evse) {
        setFormData({
          chargeLevel: evse.charge_level,
          connectorType: evse.connector_type,
          price: evse.price,
        });
      }
    }, []);

    const handleInputChange = ({ target }) => {
      const { name, value } = target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSave = () => {
      const data = {
        ...id,
        ...formData,
      };
      if (!data.chargeLevel
        || !data.connectorType
        || !data.price) {
        return;
      }
      dispatch(evseUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CForm>
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
          color="warning"
          onClick={handleSave}
        >
          Save
        </CButton>
        <CButton
          className="ms-2"
          variant="outline"
          color="secondary"
          onClick={() => setIsEdit(false)}
        >
          Cancel
        </CButton>
      </CForm>
    )
  };

  const Delete = () => {
    const confirmation = "DELETE";
    const [input, setInput] = useState("");

    const handleDelete = () => {
      if (input !== confirmation) {
        return;
      }
      dispatch(evseDeleteById(id));
    };

    return (
      <CForm>
        <label htmlFor="deleteForm">Type "{confirmation}" to delete EVSE</label>
        <CFormInput
          className="mb-3 shadow-none"
          id="deleteForm"
          placeholder="Confirmation"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="float-end">
          <CButton
            variant="outline"
            color="secondary"
            onClick={() => setIsDelete(false)}
          >
            Cancel
          </CButton>
          <CButton
            className="ms-2"
            variant="outline"
            color="danger"
            disabled={input !== confirmation}
            onClick={handleDelete}
          >
            Delete
          </CButton>
        </div>
      </CForm>
    );
  };

  return (
    <>
      {isEdit
        ? <Edit />
        : isDelete
          ? <Delete />
          : <Info />
      }
    </>
  );
};

export default EvseDetails;
