import L from "leaflet";
import siteIconUrl from "assets/site_pointer.png";
import stationIconUrl from "assets/station_pointer.png";
import userIconUrl from "assets/user_pointer.png";
import greenStationIconUrl from "assets/station_pointer_green.png"
import grayStationIconUrl from "assets/station_pointer_gray.png"
import yellowStationIconUrl from "assets/station_pointer_yellow.png"
import redStationIconUrl from "assets/station_pointer_red.png"

export const userIcon = L.icon({
  iconUrl: userIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

export const stationIcon = L.icon({
  iconUrl: stationIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

export const newStationIcon = L.icon({
  iconUrl: greenStationIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

export const siteIcon = L.icon({
  iconUrl: siteIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

export const stationStatusIcon = (status) => {
  let iconUrl;
  switch (status) {
    case "Available":
      iconUrl = greenStationIconUrl;
      break;
    case "Occupied":
      iconUrl = yellowStationIconUrl;
      break;
    case "Unavailable":
      iconUrl = grayStationIconUrl;
      break;
    case "Faulted":
      iconUrl = redStationIconUrl;
      break;
    default:
      iconUrl = grayStationIconUrl
  }
  return L.icon({
    iconUrl: iconUrl,
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60],
  });
};
