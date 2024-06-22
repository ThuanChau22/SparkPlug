def convert_coords_to_float(data):
    return [
        {
            **item,
            "latitude": float(item["latitude"]),
            "longitude": float(item["longitude"]),
        }
        for item in data
    ]


def convert_price_to_float(data):
    return [{**item, "price": float(item["price"])} for item in data]
