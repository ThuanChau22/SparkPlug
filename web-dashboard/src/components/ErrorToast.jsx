import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CButton,
  CToaster,
  CToast,
  CToastBody,
  CToastClose,
} from "@coreui/react";
import { v4 as uuid } from "uuid";

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
        <CToast key={uuid()} className="border border-danger text-danger mt-3 mb-0">
          <div className="d-flex justify-content-between">
            <CToastBody className="p-2 pe-0">
              {errorMessage}
            </CToastBody>
            <CToastClose
              className="border border-0 text-danger ps-1"
              as={CButton}
              color="link"
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
