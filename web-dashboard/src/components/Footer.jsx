import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { CFooter } from "@coreui/react";

import { layoutStateSetFooterHeight } from "redux/layout/layoutSlice";

const Footer = () => {
  const footerRef = useRef({});

  const dispatch = useDispatch();

  const handleResize = useCallback(() => {
    dispatch(layoutStateSetFooterHeight(footerRef.current.offsetHeight));
  }, [dispatch]);

  useEffect(() => {
    handleResize();
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <CFooter ref={footerRef} className="d-inline text-center">
      <small>SparkPlug &copy; {new Date().getFullYear()} by CMPE-295A</small>
    </CFooter>
  )
}

export default Footer;
