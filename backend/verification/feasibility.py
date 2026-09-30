"""
REUNIFY Feasibility & Geographic Velocity Engine
Strictly enforces: DO NOT invent distances for unknown locations.
If geographic information is insufficient, returns location_data_insufficient = True.
"""

import math
from datetime import datetime
from typing import Dict, Any, Optional

# Verified disaster district coordinates (Latitude, Longitude)
DISTRICT_COORDINATES: Dict[str, Dict[str, float]] = {
    "madurai": {"lat": 9.9252, "lng": 78.1198},
    "theni": {"lat": 10.0104, "lng": 77.4768},
    "dindigul": {"lat": 10.3673, "lng": 77.9803},
    "tiruchirappalli": {"lat": 10.7905, "lng": 78.7047},
    "trichy": {"lat": 10.7905, "lng": 78.7047},
    "cuddalore": {"lat": 11.7480, "lng": 79.7714},
    "chennai": {"lat": 13.0827, "lng": 80.2707},
    "salem": {"lat": 11.6643, "lng": 78.1460},
    "coimbatore": {"lat": 11.0168, "lng": 76.9558},
    "thanjavur": {"lat": 10.7870, "lng": 79.1378},
}

# Verified road distances for known key corridors (km)
ROAD_DISTANCE_CACHE: Dict[str, float] = {
    "madurai:theni": 75.2,
    "theni:madurai": 75.2,
    "madurai:dindigul": 66.0,
    "dindigul:madurai": 66.0,
    "madurai:trichy": 135.0,
    "trichy:madurai": 135.0,
    "madurai:tiruchirappalli": 135.0,
    "tiruchirappalli:madurai": 135.0,
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


def get_location_distance_km(district_a: Optional[str], district_b: Optional[str]) -> Optional[float]:
    """
    Returns exact or haversine-derived road distance.
    DO NOT INVENT DISTANCE. If either district is missing or unknown, returns None.
    """
    if not district_a or not district_b:
        return None

    norm_a = district_a.strip().lower()
    norm_b = district_b.strip().lower()

    if not norm_a or not norm_b:
        return None

    if norm_a == norm_b:
        return 5.0  # Within same municipal / district boundary

    cache_key = f"{norm_a}:{norm_b}"
    if cache_key in ROAD_DISTANCE_CACHE:
        return ROAD_DISTANCE_CACHE[cache_key]

    coord_a = DISTRICT_COORDINATES.get(norm_a)
    coord_b = DISTRICT_COORDINATES.get(norm_b)

    if coord_a and coord_b:
        crow_flies = haversine_km(coord_a["lat"], coord_a["lng"], coord_b["lat"], coord_b["lng"])
        # Standard disaster road detour factor: 1.25
        return round(crow_flies * 1.25, 1)

    # Unknown geographic coordinates: return None. DO NOT invent an arbitrary distance.
    return None


def parse_timestamp(ts: Any) -> Optional[datetime]:
    if isinstance(ts, datetime):
        return ts.replace(tzinfo=None) if ts.tzinfo else ts
    if not ts or not isinstance(ts, str):
        return None
    cleaned = ts.strip().replace("Z", "+00:00")
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.replace(tzinfo=None) if dt.tzinfo else dt
        except ValueError:
            continue
    # Attempt isoformat fallback
    try:
        dt = datetime.fromisoformat(cleaned)
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except Exception:
        return None


def calculate_travel_feasibility(
    district_a: Optional[str],
    time_a: Any,
    district_b: Optional[str],
    time_b: Any,
) -> Dict[str, Any]:
    """
    Evaluates physical travel feasibility between two sightings.
    If coordinates or temporal data are missing, flags location_data_insufficient = True.
    """
    dt_a = parse_timestamp(time_a)
    dt_b = parse_timestamp(time_b)

    if not dt_a or not dt_b:
        return {
            "location_data_insufficient": True,
            "reason": "Timestamp information missing or unparseable.",
            "distance_km": None,
            "time_diff_minutes": None,
            "required_speed_kmh": None,
        }

    distance_km = get_location_distance_km(district_a, district_b)
    if distance_km is None:
        return {
            "location_data_insufficient": True,
            "reason": f"Unknown location coordinates for '{district_a}' or '{district_b}'. No distance invented.",
            "distance_km": None,
            "time_diff_minutes": None,
            "required_speed_kmh": None,
        }

    time_diff_seconds = abs((dt_a - dt_b).total_seconds())
    time_diff_minutes = round(time_diff_seconds / 60.0, 1)

    hours = max(time_diff_seconds / 3600.0, 0.0167)  # At least 1 minute to prevent divide by zero
    required_speed_kmh = round(distance_km / hours, 1)

    return {
        "location_data_insufficient": False,
        "distance_km": distance_km,
        "time_diff_minutes": time_diff_minutes,
        "required_speed_kmh": required_speed_kmh,
    }
