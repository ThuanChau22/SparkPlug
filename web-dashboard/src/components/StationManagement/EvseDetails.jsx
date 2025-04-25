import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
} from "@coreui/react";

import FormInput from "components/FormInput";
import LoadingIndicator from "components/LoadingIndicator";
import useFetchData from "hooks/useFetchData";
import {
  evseGetById,
  evseUpdateById,
  evseDeleteById,
  selectEvseById,
} from "redux/evse/evseSlice";

const EvseDetails = ({ stationId, evseId }) => {
  const evse = useSelector((state) => {
    return selectEvseById(state, { stationId, evseId });
  });

  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  const { loadState } = useFetchData({
    condition: !evse,
    action: useCallback(() => evseGetById({
      stationId,
      evseId,
    }), [stationId, evseId]),
  });

  const dispatch = useDispatch();

  const Info = () => {
    const { evse_id, charge_level, connector_type, price } = evse;
    const formatPrice = (price) => {
      const options = { style: "currency", currency: "USD" };
      return new Intl.NumberFormat("en-US", options).format(price);
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
        <p>
          <span>Charge Level: </span>
          <span className="text-secondary">
            {charge_level}
          </span>
        </p>
        <p>
          <span>Connector Type: </span>
          <span className="text-secondary">
            {connector_type}
          </span>
        </p>
        <p>
          <span>Price: </span>
          <span className="text-secondary">
            {formatPrice(price)}
          </span>
        </p>
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
    const [validated, setValidated] = useState(false);

    useEffect(() => {
      if (evse) {
        setFormData({
          evseId: evse.evse_id,
          chargeLevel: evse.charge_level,
          connectorType: evse.connector_type,
          price: evse.price.toString(),
        });
      }
    }, []);

    const handleInputChange = ({ target }) => {
      const { name, value } = target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSave = () => {
      const data = {
        stationId,
        evseId,
        ...formData,
      };
      if (!data.chargeLevel
        || !data.connectorType
        || !data.price
      ) {
        setValidated(true);
        return;
      }
      dispatch(evseUpdateById(data));
      setIsEdit(false);
    };

    return (
      <CForm noValidate validated={validated}>
        <FormInput
          InputForm={CFormInput}
          className="mb-3"
          label="EVSE ID"
          name="evseId"
          type="number"
          min="1"
          placeholder="EVSE ID"
          value={evseId}
          feedbackInvalid="Please provide EVSE ID"
          required
          disabled
        />
        <FormInput
          InputForm={CFormSelect}
          className="mb-3"
          label="Charge Level"
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
          className="mb-3"
          label="Connector Type"
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
          className="mb-3"
          label="Price"
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
      dispatch(evseDeleteById({
        stationId,
        evseId,
      }));
    };

    return (
      <CForm>
        <label
          className="mb-2"
          htmlFor="deleteForm"
        >
          Type "{confirmation}" to delete EVSE
        </label>
        <FormInput
          InputForm={CFormInput}
          className="mb-3"
          id="deleteForm"
          placeholder="Confirmation"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <CButton
          variant="outline"
          color="danger"
          disabled={input !== confirmation}
          onClick={handleDelete}
        >
          Delete
        </CButton>
        <CButton
          className="ms-2"
          variant="outline"
          color="secondary"
          onClick={() => setIsDelete(false)}
        >
          Cancel
        </CButton>
      </CForm>
    );
  };

  return (loadState.loading
    ? <LoadingIndicator loading={loadState.loading} />
    : isEdit
      ? <Edit />
      : isDelete
        ? <Delete />
        : <Info />
  );
};

export default EvseDetails;
