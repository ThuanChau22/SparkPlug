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
    errorElement: <ErrorBoundary />,
    children: [
      {
        errorElement: <ErrorBoundary />,
        children:
          [
            {
              path: routes.Resources.Sites.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Resources.Sites.Components.Management.path,
                  element: routes.Resources.Sites.Components.Management.element,
                },
                {
                  path: routes.Resources.Sites.Components.Monitor.path,
                  element: routes.Resources.Sites.Components.Monitor.element,
                },
                {
                  path: routes.Resources.Sites.Components.Analytics.path,
                  element: routes.Resources.Sites.Components.Analytics.element,
                },
              ]
            },
            {
              path: routes.Resources.Stations.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Resources.Stations.Components.Management.path,
                  element: routes.Resources.Stations.Components.Management.element,
                },
                {
                  path: routes.Resources.Stations.Components.Monitor.path,
                  element: routes.Resources.Stations.Components.Monitor.element,
                },
                {
                  path: routes.Resources.Stations.Components.Analytics.path,
                  element: routes.Resources.Stations.Components.Analytics.element,
                },
              ]
            },
            {
              path: routes.Resources.Users.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Resources.Users.Components.Management.path,
                  element: routes.Resources.Users.Components.Management.element,
                },
                {
                  path: routes.Resources.Users.Components.Analytics.path,
                  element: routes.Resources.Users.Components.Analytics.element,
                },
              ]
            },
            {
              path: routes.Resources.Transactions.path,
              element: <Outlet />,
              children: [
                {
                  path: routes.Resources.Transactions.Components.Analytics.path,
                  element: routes.Resources.Transactions.Components.Analytics.element,
                },
              ],
            },
            {
              path: routes.Profile.path,
              element: routes.Profile.element,
            },
            {
              path: routes.Settings.path,
              element: routes.Settings.element,
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
]);

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <StateProvider store={store}>
      <RouterProvider router={router} />
    </StateProvider>
  </React.StrictMode>
);
