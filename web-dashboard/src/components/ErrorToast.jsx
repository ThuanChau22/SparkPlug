import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CToaster,
  CToast,
  CToastBody,
  CToastClose,
} from "@coreui/react";

import {
  selectErrorMessage,
  errorStateClear,
} from "redux/error/errorSlice";

const ErrorToast = () => {
  const errorMessage = useSelector(selectErrorMessage);
  const [toast, setToast] = useState();
  const dispatch = useDispatch();
  useEffect(() => {
    if (errorMessage) {
      setToast(
        <CToast className="border border-danger text-danger mt-3 mb-0">
          <div className="d-flex">
            <CToastBody className="p-2">
              {errorMessage}
            </CToastBody>
            <CToastClose
              className="border border-0 ms-auto"
              as={CButton}
              color="danger"
              variant="ghost"
              size="sm"
            >
              Dismiss
            </CToastClose>
          </div>
        </CToast>
      );
      dispatch(errorStateClear());
    }
  }, [errorMessage, dispatch]);
  return (
    <CToaster
      className="w-100 d-flex flex-column align-items-center"
      placement="top"
      push={toast}
    />
  );
};

export default ErrorToast;