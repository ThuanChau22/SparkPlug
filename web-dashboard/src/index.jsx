import React from "react";
import {
  createRoot,
} from "react-dom/client";
import {
  Provider as StateProvider,
} from "react-redux";
import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import { store } from "redux/store";
import routes from "routes";
import "scss/style.scss";

const ErrorBoundary = () => {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 403) {
    return routes.Unauthorized.element;
  }
  return routes.NotFound.element;
};

const router = createBrowserRouter([
  {
    path: routes.Root.path,
    element: routes.Root.element,
    errorElement: (
      <div className="min-vh-100 d-flex align-items-center">
        <ErrorBoundary />
      </div>
    ),
    children: [
      {
        errorElement: <ErrorBoundary />,
        children:
          [
            {
              path: routes.Dashboard.path,
              element: routes.Dashboard.element,
            },
            {
              path: routes.Stations.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Stations.Components.Management.path,
                  element: routes.Stations.Components.Management.element,
                },
                {
                  path: routes.Stations.Components.Monitor.path,
                  element: routes.Stations.Components.Monitor.element,
                },
                {
                  path: routes.Stations.Components.Analytics.path,
                  element: routes.Stations.Components.Analytics.element,
                },
              ]
            },
            {
              path: routes.Sites.path,
              element: routes.Sites.element,
            },
            {
              path: routes.Users.path,
              element: routes.Users.element,
            },
            {
              path: routes.Driver.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Driver.Components.Dashboard.path,
                  element: routes.Driver.Components.Dashboard.element,
                },
                {
                  path: routes.Driver.Components.Stations.path,
                  element: routes.Driver.Components.Stations.element,
                },
              ]
            },
            {
              path: routes.Profile.path,
              element: routes.Profile.element,
            },
            {
              path: routes.Settings.path,
              element: routes.Settings.element,
            },
            {
              path: routes.StationPrediction.path,
              element: routes.StationPrediction.element,
            },
          ],
      },
    ],
  },
  {
    path: routes.Login.path,
    element: routes.Login.element,
  },
  {
    path: routes.Register.path,
    element: routes.Register.element,
  },
  {
    path: routes.Unauthorized.path,
    element: routes.Unauthorized.element,
  },
], { future: { v7_relativeSplatPath: true } });

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <StateProvider store={store}>
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true }}
      />
    </StateProvider>
  </React.StrictMode>
);
