// mapIcons.js

import L from 'leaflet';
import siteIconUrl from '../assets/site_pointer.png';  
import stationIconUrl from '../assets/station_pointer.png';

export const stationIcon = L.icon({
  iconUrl: stationIconUrl,
  iconSize: [80, 80], 
  iconAnchor: [40, 80], 
  popupAnchor: [0, -80], 
});

export const siteIcon = L.icon({
  iconUrl: siteIconUrl,
  iconSize: [80, 80], 
  iconAnchor: [40, 80], 
  popupAnchor: [0, -80], 
});
