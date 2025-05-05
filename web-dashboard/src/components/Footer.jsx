import { useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { CFooter } from "@coreui/react";

import useWindowResize from "hooks/useWindowResize";
import { layoutStateSetFooterHeight } from "redux/app/layoutSlice";

const Footer = () => {
  const footerRef = useRef({});
  const dispatch = useDispatch();
  useWindowResize(useCallback(() => {
    dispatch(layoutStateSetFooterHeight(footerRef.current.offsetHeight));
  }, [dispatch]));
  return (
    <CFooter ref={footerRef} className="d-inline text-center">
      <small>SparkPlug &copy; {new Date().getFullYear()} by CMPE-295A</small>
    </CFooter>
  )
}

export default Footer;
