import { useLocation } from "react-router-dom";
import { CBreadcrumb, CBreadcrumbItem } from "@coreui/react";

import routes from "routes";

const Breadcrumb = () => {
  const location = useLocation();

  const routeList = [];
  for (const { name, path, Components } of Object.values(routes)) {
    routeList.push({ name, path });
    for (const { name, path } of Object.values(Components || {})) {
      routeList.push({ name, path });
    }
  }

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (path) => {
    const breadcrumbs = []
    path.split("/").reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`;
      const routeName = getRouteName(currentPathname, routeList);
      routeName && breadcrumbs.push({
        pathname: currentPathname,
        name: routeName,
        active: index + 1 === array.length ? true : false,
      })
      return currentPathname;
    })
    return breadcrumbs;
  }

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <CBreadcrumb className="m-0 ms-2">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default Breadcrumb;
