from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityBatchBase(BaseModel):
    route_id: int
    batch_name: str
    people_count: int
    activity_date: datetime
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = "已登记"
    notes: Optional[str] = None


class ActivityBatchCreate(ActivityBatchBase):
    risk_level: Optional[str] = "无"
    risk_summary: Optional[str] = None
    risk_confirmed: Optional[int] = 0


class ActivityBatchUpdate(ActivityBatchBase):
    risk_level: Optional[str] = None
    risk_summary: Optional[str] = None
    risk_confirmed: Optional[int] = None


class ActivityBatchResponse(ActivityBatchBase):
    id: int
    leader_id: int
    risk_level: Optional[str] = "无"
    risk_summary: Optional[str] = None
    risk_confirmed: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RouteRiskAssessment(BaseModel):
    route_id: int
    route_name: str
    risk_level: str
    risk_factors: list
    suggestions: list
    needs_confirmation: bool


class RouteChangeBase(BaseModel):
    batch_id: int
    original_route_id: Optional[int] = None
    new_route_description: Optional[str] = None
    reason: Optional[str] = None


class RouteChangeCreate(RouteChangeBase):
    pass


class RouteChangeResponse(RouteChangeBase):
    id: int
    change_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackBase(BaseModel):
    batch_id: int
    rating: int
    content: Optional[str] = None
    issues_encountered: Optional[str] = None
    suggestions: Optional[str] = None


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackResponse(FeedbackBase):
    id: int
    leader_id: int
    created_at: datetime

    class Config:
        from_attributes = True
