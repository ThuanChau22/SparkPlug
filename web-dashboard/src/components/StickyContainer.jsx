import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className = "", style = {}, children }, ref) => (
  <div className={className} style={{ ...style, position: "sticky", zIndex: 1010 }} ref={ref}>
    {children}
  </div >
));

export default StickyContainer;
