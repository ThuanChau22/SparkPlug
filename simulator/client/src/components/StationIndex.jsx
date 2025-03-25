import { CContainer, CImage } from "@coreui/react";

import EVChargingStationImage from "assets/ev-charging-station.png";

const StationIndex = () => {
  return (
    <CContainer className="d-none d-md-flex flex-column justify-content-center align-items-center h-100">
      <div
        style={{
          borderRadius: "50%",
          position: "relative",
          width: 285,
          height: 285,
          background: `conic-gradient(
                from 60deg,
                #7666f7,
                #cc6dc8,
                #2584a0,
                #7666f7
              )`,
        }}
      >
        <div
          style={{
            backgroundColor: "var(--cui-body-bg)",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 275,
            height: 275,
          }}
        >
          <CImage
            className="ms-4"
            src={EVChargingStationImage}
            fluid
            width={200}
            height={200}
          />
        </div>
      </div>
      <div className="fs-3 fw-bold text-center">
        <p className="m-0">EV Charging</p>
        <p className="m-0">Station Simulator</p>
      </div>
    </CContainer>
  );
};

export default StationIndex;
