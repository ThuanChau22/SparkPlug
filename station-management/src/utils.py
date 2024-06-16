def convert_coords_to_float_sites(sites):
    return [
        {
            **site,
            "latitude": float(site["latitude"]),
            "longitude": float(site["longitude"]),
        }
        for site in sites
    ]


def convert_coords_to_float_stations(stations):
    return [
        {
            **station,
            "latitude": float(station["latitude"]),
            "longitude": float(station["longitude"]),
            "site_latitude": float(station["site_latitude"]),
            "site_longitude": float(station["site_longitude"]),
        }
        for station in stations
    ]
