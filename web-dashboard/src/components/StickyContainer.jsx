import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className, top, children }, ref) => (
  <div className={`sticky-top ${className}`} style={{ top }} ref={ref}>
    {children}
  </div>
));

export default StickyContainer;
