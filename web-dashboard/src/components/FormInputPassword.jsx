import { useState } from "react";
import { CButton } from "@coreui/react";
import {
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";

import FormInput from "components/FormInput";

const FormInputPassword = (props) => {
  const [visible, setVisible] = useState(false);
  return (
    <FormInput
      {...props}
      type={visible ? "text" : "password"}
      button={
        <CButton
          className="border border-start-0 rounded-end"
          onClick={() => setVisible((state) => !state)}
        >
          {visible
            ? <VisibilityOffOutlined fontSize="small" />
            : <VisibilityOutlined fontSize="small" />
          }
        </CButton>
      }
    />
  );
};

export default FormInputPassword;
