import {
  Link,
} from "react-router-dom";
import {
  CCol,
  CContainer,
  CRow,
} from "@coreui/react";

const Unauthorized = () => {
  return (
    <div className="bg-light h-100 position-relative">
      <CContainer className="position-absolute top-50 start-50 translate-middle">
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix">
              <h1 className="float-start display-3 me-4">403</h1>
              <h4 className="pt-3">Access denied!</h4>
              <p className="text-medium-emphasis float-start">
                <span>You do not have access to this page.</span>
                <Link className="d-block" to="/">Go to home page.</Link>
              </p>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Unauthorized;
