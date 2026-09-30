"""
REUNIFY Agent Schemas
Defines strict Pydantic models for LLM output and allowlisted actions.
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

# Allowlisted tools and actions
ALLOWLISTED_ACTIONS = [
    "search_shelter",
    "search_hospital",
    "search_helpline",
    "review_candidate",
    "finish_investigation",
]


class AgentPlanSchema(BaseModel):
    """
    Schema for LLM-generated investigation plans.
    Strictly validated. Any action outside allowlist is rejected.
    """
    action: str = Field(
        ...,
        description="The allowlisted tool to execute: search_shelter, search_hospital, search_helpline, review_candidate, finish_investigation",
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters for the selected tool (e.g. {'district': 'Madurai'})",
    )
    reason: str = Field(
        ...,
        description="Justification for this investigation action based on evidence context",
    )
    continue_investigation: bool = Field(
        default=True,
        description="Whether further investigative actions are required",
    )
    reflection: Optional[str] = Field(
        default=None,
        description="Optional reflection on contradictions, anomalies, or new evidence",
    )


class AgentStepLog(BaseModel):
    step_order: int
    phase: str  # PLAN, ACT, OBSERVE, VERIFY, REFLECT, REPLAN
    action: str
    tool: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    observation: Optional[str] = None
    reflection: Optional[str] = None
    audit_notes: Optional[List[str]] = None
    timestamp: str
