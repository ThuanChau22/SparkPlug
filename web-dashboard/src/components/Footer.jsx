import { CFooter } from "@coreui/react";

const Footer = () => {
  return (
    <CFooter className="d-inline text-center">
      <small>SparkPlug &copy; {new Date().getFullYear()} by CMPE-295A</small>
    </CFooter>
  )
}

export default Footer;
