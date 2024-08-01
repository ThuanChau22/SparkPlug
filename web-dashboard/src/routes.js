import App from "App";
import AccountProfile from "pages/AccountProfile";
import AccountSettings from "pages/AccountSetting";
import Login from "pages/Login";
import Register from "pages/Register";
import Dashboard from "pages/Dashboard";
import SiteManagement from "pages/SiteManagement";
import StationManagement from "pages/StationManagement";
import StationMonitor from "pages/StationMonitor";
import StationAnalytics from "pages/StationAnalytics";
import UserManagement from "pages/UserManagement";
import DriverDashboard from "pages/DriverDashboard";
import DriverStations from "pages/DriverStation";
import AIPredictedLocation from "pages/AIPredictedLocation";
import Unauthorized from "pages/Unauthorized";
import NotFound from "pages/NotFound";

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

const Driver = {
  Dashboard: {
    name: "Dashboard",
    path: "/driver/dashboard",
    element: <DriverDashboard />
  },
  Stations: {
    name: "Stations",
    path: "/driver/stations",
    element: <DriverStations />
  },
  AIPredictedLocation: {
    name: "AIPredictedLocation",
    path: "/driver/aipredictedlocation",
    element: <AIPredictedLocation />,
  },
};

const routes = {
  Root: {
    Name: "Home",
    path: "/",
    element: <App />,
  },
  Dashboard: {
    name: "Dashboard",
    path: "/dashboard",
    element: <Dashboard />,
  },
  AIPredictedLocation: {
    name: "AIPredictedLocation",
    path: "/aipredictedlocation",
    element: <AIPredictedLocation />,
  },
  Stations: {
    name: "Stations",
    path: "/stations",
    defaultPath: Stations.Management.path,
    Components: Stations,   
  },
  Sites: {
    name: "Sites",
    path: "/sites",
    element: <SiteManagement />,
  },
  Users: {
    name: "Users",
    path: "/users",
    element: <UserManagement />,
  },
  Driver: {
    name: "Driver",
    path: "/driver",
    defaultPath: Driver.Dashboard.path,
    Components: Driver,
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