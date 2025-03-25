import { useEffect, useState } from "react";
import { useColorModes } from "@coreui/react";

const useTheme = () => {
  const ThemeName = "theme";
  const ThemeModes = {
    Auto: "auto",
    Light: "light",
    Dark: "dark",
  };
  const storedTheme = localStorage.getItem(ThemeName);
  const [theme, setTheme] = useState(storedTheme || ThemeModes.Auto);
  const { setColorMode } = useColorModes(ThemeName);
  useEffect(() => {
    setColorMode(theme);
    localStorage.setItem(ThemeName, theme);
  }, [theme, setColorMode]);
  return { ThemeModes, theme, setTheme };
}

export default useTheme;
