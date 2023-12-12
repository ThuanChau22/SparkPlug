import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StationMarker from './StationMarker';


const MapBoundsSetter = ({ locations }) => {
    const map = useMap();

    useEffect(() => {
        if (locations && locations.length > 0) {
            const bounds = new L.LatLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
            map.fitBounds(bounds);
        }
    }, [locations, map]);

    return null;
};

const MapContainer = ({ locations, icon, onMarkerClick }) => {
    // Default position can be set to a fallback location
    const defaultPosition = [37.3352, 121.8811];
    const zoomLevel = 13;

    return (
        <LeafletMap center={defaultPosition} zoom={zoomLevel} style={{ height: '600px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {locations.map((loc, index) => (
                <Marker key={index} position={[loc.latitude, loc.longitude]} icon={icon}>
                    <Popup>
                        {loc.name} <br/> {loc.city}, {loc.state}
                    </Popup>
                </Marker>
            ))}
            <MapBoundsSetter locations={locations} />
        </LeafletMap>
    );
};

export default MapContainer;
