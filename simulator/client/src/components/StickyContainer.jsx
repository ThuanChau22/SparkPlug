import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className = "", style = {}, children }, ref) => (
  <div ref={ref} className={className} style={{ position: "sticky", zIndex: 1010, ...style }}>
    {children}
  </div >
));

export default StickyContainer;
