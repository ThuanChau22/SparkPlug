import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className = "", top = "", children }, ref) => (
  <div className={className} style={{ position: "sticky", zIndex: 1010, top }} ref={ref}>
    {children}
  </div>
));

export default StickyContainer;
