import { useRef } from "react";
import { useDispatch } from "react-redux";
import { CFooter } from "@coreui/react";

import useWindowResize from "hooks/useWindowResize";
import { layoutStateSetFooterHeight } from "redux/layout/layoutSlice";

const Footer = () => {
  const footerRef = useRef({});
  const dispatch = useDispatch();
  useWindowResize(() => {
    dispatch(layoutStateSetFooterHeight(footerRef.current.offsetHeight));
  });
  return (
    <CFooter ref={footerRef} className="d-inline text-center">
      <small>SparkPlug &copy; {new Date().getFullYear()} by CMPE-295A</small>
    </CFooter>
  )
}

export default Footer;
