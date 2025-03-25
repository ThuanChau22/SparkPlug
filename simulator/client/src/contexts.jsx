import { createContext } from "react";

export const LayoutContext = createContext({
  isMobile: false,
  headerHeight: 0,
  footerHeight: 0,
  setIsMobile: () => { },
  setHeaderHeight: () => { },
  setFooterHeight: () => { },
});

export const ToastContext = createContext({
  toastMessage: { text: "", color: "" },
  setToastMessage: () => { },
});
