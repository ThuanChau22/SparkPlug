import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useColorModes } from "@coreui/react";

import {
  ThemeModes,
  layoutStateSetTheme,
  selectLayoutTheme,
} from "redux/layout/layoutSlice";

const useLayoutTheme = () => {
  const itemName = "theme";
  const storedTheme = localStorage.getItem(itemName);
  localStorage.setItem(itemName, storedTheme || ThemeModes.Auto);

  const { setColorMode } = useColorModes(itemName);
  const theme = useSelector(selectLayoutTheme);

  const dispatch = useDispatch();

  useEffect(() => {
    const storedTheme = localStorage.getItem(itemName);
    dispatch(layoutStateSetTheme(storedTheme));
  }, [dispatch]);

  useEffect(() => {
    setColorMode(theme);
    localStorage.setItem(itemName, theme);
  }, [theme, setColorMode]);

  return theme;
}

export default useLayoutTheme;
