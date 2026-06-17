from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TrailSegmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_point: Optional[str] = None
    end_point: Optional[str] = None
    length_km: Optional[float] = None
    difficulty: Optional[str] = None
    status: Optional[str] = "正常开放"


class TrailSegmentCreate(TrailSegmentBase):
    pass


class TrailSegmentUpdate(TrailSegmentBase):
    pass


class TrailSegmentResponse(TrailSegmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ObservationPointBase(BaseModel):
    name: str
    segment_id: int
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_bleachers: Optional[int] = 0
    bleachers_status: Optional[str] = "正常"
    status: Optional[str] = "正常开放"


class ObservationPointCreate(ObservationPointBase):
    pass


class ObservationPointUpdate(ObservationPointBase):
    pass


class ObservationPointResponse(ObservationPointBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityRouteBase(BaseModel):
    name: str
    description: Optional[str] = None
    segment_ids: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    max_people: Optional[int] = None
    difficulty: Optional[str] = None
    status: Optional[str] = "正常开放"


class ActivityRouteCreate(ActivityRouteBase):
    pass


class ActivityRouteUpdate(ActivityRouteBase):
    pass


class ActivityRouteResponse(ActivityRouteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: Optional[int] = 0
    location: Optional[str] = None
    status: Optional[str] = "良好"
    notes: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(EquipmentBase):
    pass


class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InspectionCycleBase(BaseModel):
    segment_id: int
    cycle_days: Optional[int] = 7
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None


class InspectionCycleCreate(InspectionCycleBase):
    pass


class InspectionCycleUpdate(InspectionCycleBase):
    pass


class InspectionCycleResponse(InspectionCycleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
