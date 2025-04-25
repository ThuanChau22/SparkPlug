import {
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

const FormInput = ({ InputForm, className, icon, label, button, ...remain }) => (
  <CInputGroup className={className}>
    {(icon || label) && (<CInputGroupText>{icon}{label}</CInputGroupText>)}
    {InputForm && (
      <InputForm
        className={`border ${button ? "border-end-0" : "rounded-end"} shadow-none`}
        {...remain}
      />
    )}
    {button}
  </CInputGroup>
);

export default FormInput;
