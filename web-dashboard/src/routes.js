import App from "App";
import AccountProfile from "pages/AccountProfile";
import AccountSettings from "pages/AccountSetting";
import Login from "pages/Login";
import Register from "pages/Register";
import SiteManagement from "pages/SiteManagement";
// import SiteMonitor from "pages/SiteMonitor";
import SiteAnalytics from "pages/SiteAnalytics";
import StationManagement from "pages/StationManagement";
import StationMonitor from "pages/StationMonitor";
import StationAnalytics from "pages/StationAnalytics";
import UserManagement from "pages/UserManagement";
// import UserAnalytics from "pages/UserAnalytics";
// import TransactionAnalytics from "pages/Transactions";
import DriverStations from "pages/DriverStation";
import Unauthorized from "pages/Unauthorized";
import NotFound from "pages/NotFound";

const Sites = {
  Management: {
    name: "Management",
    path: "/sites/management",
    element: <SiteManagement />,
  },
  // Monitor: {
  //   name: "Monitor",
  //   path: "/sites/monitor",
  //   element: <SiteMonitor />,
  // },
  Analytics: {
    name: "Analytics",
    path: "/sites/analytics",
    element: <SiteAnalytics />,
  },
};

const Stations = {
  Management: {
    name: "Management",
    path: "/stations/management",
    element: <StationManagement />,
  },
  Monitor: {
    name: "Monitor",
    path: "/stations/monitor",
    element: <StationMonitor />,
  },
  Analytics: {
    name: "Analytics",
    path: "/stations/analytics",
    element: <StationAnalytics />,
  },
};

const Users = {
  Management: {
    name: "Management",
    path: "/users/management",
    element: <UserManagement />,
  },
  // Analytics: {
  //   name: "Analytics",
  //   path: "/users/analytics",
  //   element: <UserAnalytics />,
  // },
};

// const Transactions = {
//   Analytics: {
//     name: "Analytics",
//     path: "/transactions/analytics",
//     element: <TransactionAnalytics />,
//   }
// };

const routes = {
  Root: {
    Name: "Home",
    path: "/",
    element: <App />,
    defaultPath: Sites.Management.path,
  },
  Resources: {
    Sites: {
      name: "Sites",
      path: "/sites",
      defaultPath: Sites.Management.path,
      Components: Sites,
    },
    Stations: {
      name: "Stations",
      path: "/stations",
      defaultPath: Stations.Management.path,
      Components: Stations,
    },
    Users: {
      name: "Users",
      path: "/users",
      defaultPath: Users.Management.path,
      Components: Users,
    },
    // Transactions: {
    //   name: "Transactions",
    //   path: "/transactions",
    //   defaultPath: Transactions.Analytics.path,
    //   Components: Transactions,
    // },
  },
  Login: {
    name: "Login",
    path: "/login",
    element: <Login />,
  },
  Register: {
    name: "Register",
    path: "/register",
    element: <Register />,
  },
  Profile: {
    name: "Profile",
    path: "/profile",
    element: <AccountProfile />,
  },
  Settings: {
    name: "Settings",
    path: "/settings",
    element: <AccountSettings />,
  },
  Drivers: {
    name: "Stations",
    path:"/maps",
    element: <DriverStations />
  },
  Unauthorized: {
    name: "Unauthorized",
    path: "/403",
    element: <Unauthorized />,
  },
  NotFound: {
    name: "Not Found",
    path: "/404",
    element: <NotFound />,
  },
};

export default routes;