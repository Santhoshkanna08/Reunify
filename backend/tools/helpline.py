"""
REUNIFY Helpline Tool
Queries citizen distress and sightings logs (1070 / 1077).
"""

from typing import Dict, Any, List
from ..database.supabase import get_source_records


def search_helpline(district: str = "Madurai", **kwargs) -> List[Dict[str, Any]]:
    """Retrieves normalized citizen helpline sightings."""
    return get_source_records(source_type="helpline", district=district)
