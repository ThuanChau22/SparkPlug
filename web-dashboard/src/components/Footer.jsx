import { CFooter } from "@coreui/react";

const Footer = () => {
  return (
    <CFooter className="d-inline text-center">
      SparkPlug &copy; {new Date().getFullYear()} by CMPE-281 Group 2
    </CFooter>
  )
}

export default Footer;
