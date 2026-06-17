from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InspectionRecordBase(BaseModel):
    segment_id: int
    obstruction_status: Optional[str] = None
    obstruction_details: Optional[str] = None
    slippery_warning: Optional[str] = None
    slippery_details: Optional[str] = None
    bleachers_status: Optional[str] = None
    bleachers_details: Optional[str] = None
    overall_status: Optional[str] = "正常开放"
    suggestions: Optional[str] = None


class InspectionRecordCreate(InspectionRecordBase):
    pass


class InspectionRecordResponse(InspectionRecordBase):
    id: int
    inspector_id: int
    inspection_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
