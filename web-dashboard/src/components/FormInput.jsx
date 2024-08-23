import {
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

const FormInput = ({ Icon, InputForm, label, ...remain }) => (
  <CInputGroup className="mb-3">
    {Icon && <CInputGroupText><Icon /></CInputGroupText>}
    {label && <CInputGroupText>{label}</CInputGroupText>}
    <InputForm className="border rounded-end shadow-none" {...remain} />
  </CInputGroup>
);

export default FormInput;
