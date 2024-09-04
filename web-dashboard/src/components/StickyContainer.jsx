import { forwardRef } from "react";

const StickyContainer = forwardRef(({ className, top, children }, ref) => (
  <div className={`sticky-top ${className}`} style={{ top, zIndex:900 }} ref={ref}>
    {children}
  </div>
));

export default StickyContainer;
