import { useContext, useEffect, useState } from "react";
import {
  CButton,
  CToaster,
  CToast,
  CToastBody,
  CToastClose,
} from "@coreui/react";
import { v4 as uuid } from "uuid";

import { ToastContext } from "contexts";

const ErrorToast = () => {
  const { toastMessage, setToastMessage } = useContext(ToastContext);
  const [toast, addToast] = useState();

  useEffect(() => {
    const { text, color } = toastMessage;
    if (text && color) {
      addToast(
        <CToast
          key={uuid()}
          className={`position-absolute top-0 border border-${color} text-${color} mt-3 mb-0`}
          style={{ backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.9)" }}
        >
          <div className="d-flex justify-content-between">
            <CToastBody className="p-2 pe-0">
              {text}
            </CToastBody>
            <CToastClose
              className={`border border-0 text-${color} ps-1`}
              as={CButton}
              color="link"
              size="sm"
            >
              Dismiss
            </CToastClose>
          </div>
        </CToast>
      );
      setToastMessage({ text: "", color: "" });
    }
  }, [toastMessage, setToastMessage]);
  return (
    <CToaster
      className="w-100 d-flex flex-column align-items-center"
      placement="top"
      push={toast}
    />
  );
};

export default ErrorToast;
