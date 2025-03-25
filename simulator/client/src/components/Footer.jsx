import { useContext, useRef } from "react";
import { CFooter } from "@coreui/react";

import useWindowResize from "hooks/useWindowResize";
import { LayoutContext } from "contexts";

const Footer = () => {
  const footerRef = useRef({});
  const { setFooterHeight } = useContext(LayoutContext);
  useWindowResize(() => {
    setFooterHeight(footerRef.current?.offsetHeight);
  });
  return (
    <CFooter ref={footerRef} className="d-inline text-center">
      <small>SparkPlug &copy; {new Date().getFullYear()} by CMPE-295A</small>
    </CFooter>
  )
}

export default Footer;
