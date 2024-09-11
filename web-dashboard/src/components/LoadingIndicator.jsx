import { GooeyCircleLoader } from "react-loaders-kit";
import { CContainer } from "@coreui/react";

const LoadingIndicator = ({ loading = true }) => (
  <CContainer className="d-flex flex-row flex-grow-1 justify-content-center align-items-center h-100">
    <GooeyCircleLoader
      // colors={["#f6b93b", "#5e22f0", "#ef5777"]}
      colors={["#2584a0", "#cc6dc8", "#7666f7"]}
      loading={loading}
      pause={!loading}
    />
  </CContainer>
)

export default LoadingIndicator;
