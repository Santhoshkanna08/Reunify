"""
REUNIFY Candidate & Review Decision Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class DecisionRequestSchema(BaseModel):
    reviewer_name: str
    action: str = Field(..., description="'approve', 'reject', or 'further_review'")
    rationale: str
    confidence_level: str = "high"


class CandidateResponseSchema(BaseModel):
    id: str
    case_id: str
    candidate_code: str
    source_type: str
    source_name: str
    match_score: int
    score_breakdown: Dict[str, Any]
    has_contradictions: bool
    contradictions: Optional[List[Dict[str, Any]]] = None
    status: str
    source_record: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str
