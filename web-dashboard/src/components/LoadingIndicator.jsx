import { GooeyCircleLoader } from "react-loaders-kit";
import { CContainer } from "@coreui/react";

const LoadingIndicator = ({ loading = true, size = 80, overlay = false }) => (
  <CContainer
    className="d-flex flex-row flex-grow-1 justify-content-center align-items-center h-100"
    fluid={loading && overlay}
    style={!(loading && overlay) ? {} : {
      backgroundColor: "rgba(var(--cui-body-bg-rgb), 0.5)",
      width: "100%",
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 1100,
    }}
  >
    <GooeyCircleLoader
      // colors={["#f6b93b", "#5e22f0", "#ef5777"]}
      colors={["#2584a0", "#cc6dc8", "#7666f7"]}
      loading={loading}
      pause={!loading}
      size={size}
    />
  </CContainer>
);

export default LoadingIndicator;
