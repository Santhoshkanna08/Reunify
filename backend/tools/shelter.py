"""
REUNIFY Shelter Tool
Queries shelter and relief camp admissions.
"""

from typing import Dict, Any, List
from ..database.supabase import get_source_records


def search_shelter(district: str = "Madurai", **kwargs) -> List[Dict[str, Any]]:
    """Retrieves normalized shelter intake records for the target district."""
    return get_source_records(source_type="shelter", district=district)
