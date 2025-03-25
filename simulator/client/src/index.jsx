import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "@coreui/coreui/dist/css/coreui.min.css";

import App from "App";
import StationIndex from "components/StationIndex";
import LoadingIndicator from "components/LoadingIndicator";
import Station, { loader as StationLoader } from "components/Station";
import NotFound from "components/NotFound";
import "scss/style.scss";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: (
      <div className="min-vh-100 d-flex align-items-center">
        <NotFound />
      </div>
    ),
    children: [
      {
        errorElement: <NotFound />,
        children: [
          {
            index: true,
            path: "stations",
            element: <StationIndex />,
          },
          {
            path: "stations/:stationId",
            element: <Station />,
            hydrateFallbackElement: <LoadingIndicator />,
            loader: StationLoader,
            shouldRevalidate: ({ currentUrl, nextUrl }) => {
              return currentUrl.pathname !== nextUrl.pathname;
            },
          },
        ],
      }
    ],
  },
]);

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
