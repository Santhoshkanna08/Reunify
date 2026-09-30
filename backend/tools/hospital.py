"""
REUNIFY Hospital Tool
Queries emergency hospital network admissions.
"""

from typing import Dict, Any, List
from ..database.supabase import get_source_records


def search_hospital(district: str = "Madurai", **kwargs) -> List[Dict[str, Any]]:
    """Retrieves normalized hospital emergency admissions for the target district."""
    return get_source_records(source_type="hospital", district=district)
