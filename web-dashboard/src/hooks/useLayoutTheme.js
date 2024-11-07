import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useColorModes } from "@coreui/react";

import {
  layoutStateSetTheme,
  selectLayoutTheme,
} from "redux/layout/layoutSlice";

const useLayoutTheme = () => {
  const { colorMode, setColorMode } = useColorModes("theme");
  const theme = useSelector(selectLayoutTheme);

  const dispatch = useDispatch();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    dispatch(layoutStateSetTheme(storedTheme || colorMode));
  }, [colorMode, dispatch]);

  useEffect(() => {
    setColorMode(theme);
    localStorage.setItem("theme", theme);
  }, [theme, setColorMode]);

  return theme;
}

export default useLayoutTheme;
