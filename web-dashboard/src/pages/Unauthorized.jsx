import { Link } from "react-router-dom";
import { CContainer } from "@coreui/react";

import useTheme from "hooks/useTheme";

const Unauthorized = () => {
  useTheme();
  return (
    <CContainer className="d-flex flex-grow-1 justify-content-center align-items-center h-100">
      <div>
        <h1 className="float-start display-3 me-2">403</h1>
        <h4 className="pt-3">Access denied!</h4>
        <p className="float-start text-medium-emphasis ">
          <span>You do not have access to this page.</span>
          <Link className="d-block" to="/">Go to home page.</Link>
        </p>
      </div>
    </CContainer>
  )
}

export default Unauthorized;
