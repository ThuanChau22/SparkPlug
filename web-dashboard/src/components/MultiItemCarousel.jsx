import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const MuliItemCarousel = ({ className = "", children }) => (
  <Carousel
    containerClass={`container-fluid ${className}`}
    partialVisible
    responsive={{
      xxl: {
        breakpoint: { max: 3000, min: 1400 },
        partialVisibilityGutter: 20,
        items: 6,
      },
      xl: {
        breakpoint: { max: 1399, min: 1200 },
        partialVisibilityGutter: 20,
        items: 5,
      },
      lg: {
        breakpoint: { max: 1199, min: 992 },
        partialVisibilityGutter: 15,
        items: 4,
      },
      md: {
        breakpoint: { max: 991, min: 768 },
        partialVisibilityGutter: 10,
        items: 3,
      },
      sm: {
        breakpoint: { max: 767, min: 576 },
        items: 3,
      },
      xs: {
        breakpoint: { max: 575, min: 0 },
        items: 0,
      },
    }}
  >
    {children}
  </Carousel>
);

export default MuliItemCarousel;
