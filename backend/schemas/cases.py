"""
REUNIFY Case Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CaseCreateSchema(BaseModel):
    full_name: str
    age: int
    gender: str = "Male"
    last_known_location: str
    district: str
    last_seen_date: str
    last_seen_time: Optional[str] = "18:00"
    clothing_description: Optional[str] = ""
    distinguishing_marks: Optional[str] = ""
    wristband_tag: Optional[str] = None
    alias: Optional[str] = None
    height_cm: Optional[int] = None
    medical_conditions: Optional[str] = None
    photo_url: Optional[str] = None
    reporter_name: str
    reporter_relationship: str
    reporter_phone: str
    reporter_email: Optional[str] = None
    priority: str = "high"


class CaseResponseSchema(BaseModel):
    id: str
    case_number: str
    status: str
    priority: Optional[str] = "high"
    full_name: str
    alias: Optional[str] = None
    age: int
    gender: str
    last_known_location: str
    district: str
    last_seen_date: str
    last_seen_time: Optional[str] = None
    clothing_description: Optional[str] = None
    distinguishing_marks: Optional[str] = None
    wristband_tag: Optional[str] = None
    medical_conditions: Optional[str] = None
    photo_url: Optional[str] = None
    reporter_name: str
    reporter_relationship: str
    reporter_phone: str
    reporter_email: Optional[str] = None
    data_origin: str = "synthetic"
    created_at: str
    updated_at: str
