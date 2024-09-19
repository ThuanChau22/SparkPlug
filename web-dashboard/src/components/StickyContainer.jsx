import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className = "", style = {}, children }, ref) => (
  <div className={className} style={{ position: "sticky", zIndex: 1010, ...style }} ref={ref}>
    {children}
  </div >
));

export default StickyContainer;
