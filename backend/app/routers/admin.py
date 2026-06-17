from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import (
    User, TrailSegment, ObservationPoint, ActivityRoute,
    Equipment, InspectionCycle
)
from app.schemas.trail import (
    TrailSegmentCreate, TrailSegmentUpdate, TrailSegmentResponse,
    ObservationPointCreate, ObservationPointUpdate, ObservationPointResponse,
    ActivityRouteCreate, ActivityRouteUpdate, ActivityRouteResponse,
    EquipmentCreate, EquipmentUpdate, EquipmentResponse,
    InspectionCycleCreate, InspectionCycleUpdate, InspectionCycleResponse
)
from app.auth import require_role

router = APIRouter(prefix="/admin", tags=["管理员"])


@router.get("/users", response_model=List[dict])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "full_name": u.full_name, "role": u.role} for u in users]


@router.get("/trail-segments", response_model=List[TrailSegmentResponse])
def get_trail_segments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    query = db.query(TrailSegment)
    if status:
        query = query.filter(TrailSegment.status == status)
    return query.all()


@router.post("/trail-segments", response_model=TrailSegmentResponse)
def create_trail_segment(
    segment: TrailSegmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_segment = TrailSegment(**segment.dict())
    db.add(db_segment)
    db.commit()
    db.refresh(db_segment)
    return db_segment


@router.put("/trail-segments/{segment_id}", response_model=TrailSegmentResponse)
def update_trail_segment(
    segment_id: int,
    segment: TrailSegmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_segment = db.query(TrailSegment).filter(TrailSegment.id == segment_id).first()
    if not db_segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    for key, value in segment.dict(exclude_unset=True).items():
        setattr(db_segment, key, value)
    db.commit()
    db.refresh(db_segment)
    return db_segment


@router.delete("/trail-segments/{segment_id}")
def delete_trail_segment(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_segment = db.query(TrailSegment).filter(TrailSegment.id == segment_id).first()
    if not db_segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(db_segment)
    db.commit()
    return {"message": "Segment deleted"}


@router.get("/observation-points", response_model=List[ObservationPointResponse])
def get_observation_points(
    segment_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    query = db.query(ObservationPoint)
    if segment_id:
        query = query.filter(ObservationPoint.segment_id == segment_id)
    if status:
        query = query.filter(ObservationPoint.status == status)
    return query.all()


@router.post("/observation-points", response_model=ObservationPointResponse)
def create_observation_point(
    point: ObservationPointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_point = ObservationPoint(**point.dict())
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    return db_point


@router.put("/observation-points/{point_id}", response_model=ObservationPointResponse)
def update_observation_point(
    point_id: int,
    point: ObservationPointUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_point = db.query(ObservationPoint).filter(ObservationPoint.id == point_id).first()
    if not db_point:
        raise HTTPException(status_code=404, detail="Point not found")
    for key, value in point.dict(exclude_unset=True).items():
        setattr(db_point, key, value)
    db.commit()
    db.refresh(db_point)
    return db_point


@router.delete("/observation-points/{point_id}")
def delete_observation_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_point = db.query(ObservationPoint).filter(ObservationPoint.id == point_id).first()
    if not db_point:
        raise HTTPException(status_code=404, detail="Point not found")
    db.delete(db_point)
    db.commit()
    return {"message": "Point deleted"}


@router.get("/activity-routes", response_model=List[ActivityRouteResponse])
def get_activity_routes(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    query = db.query(ActivityRoute)
    if status:
        query = query.filter(ActivityRoute.status == status)
    return query.all()


@router.post("/activity-routes", response_model=ActivityRouteResponse)
def create_activity_route(
    route: ActivityRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    if route.segment_ids:
        import re
        if not re.match(r'^[\d,]+$', route.segment_ids):
            raise HTTPException(status_code=400, detail="分段ID格式不正确，只能包含数字和英文逗号")
        
        segment_id_list = [int(x.strip()) for x in route.segment_ids.split(',') if x.strip()]
        if not segment_id_list:
            raise HTTPException(status_code=400, detail="请输入有效的分段ID")
        
        existing_segments = db.query(TrailSegment).filter(
            TrailSegment.id.in_(segment_id_list)
        ).all()
        existing_ids = [s.id for s in existing_segments]
        invalid_ids = [sid for sid in segment_id_list if sid not in existing_ids]
        
        if invalid_ids:
            raise HTTPException(
                status_code=400,
                detail=f"以下分段ID不存在：{', '.join(map(str, invalid_ids))}"
            )
    
    db_route = ActivityRoute(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.put("/activity-routes/{route_id}", response_model=ActivityRouteResponse)
def update_activity_route(
    route_id: int,
    route: ActivityRouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_route = db.query(ActivityRoute).filter(ActivityRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    if route.segment_ids is not None:
        import re
        if not re.match(r'^[\d,]*$', route.segment_ids):
            raise HTTPException(status_code=400, detail="分段ID格式不正确，只能包含数字和英文逗号")
        
        segment_id_list = [int(x.strip()) for x in route.segment_ids.split(',') if x.strip()]
        if route.segment_ids and not segment_id_list:
            raise HTTPException(status_code=400, detail="请输入有效的分段ID")
        
        if segment_id_list:
            existing_segments = db.query(TrailSegment).filter(
                TrailSegment.id.in_(segment_id_list)
            ).all()
            existing_ids = [s.id for s in existing_segments]
            invalid_ids = [sid for sid in segment_id_list if sid not in existing_ids]
            
            if invalid_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"以下分段ID不存在：{', '.join(map(str, invalid_ids))}"
                )
    
    for key, value in route.dict(exclude_unset=True).items():
        setattr(db_route, key, value)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.delete("/activity-routes/{route_id}")
def delete_activity_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_route = db.query(ActivityRoute).filter(ActivityRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    db.delete(db_route)
    db.commit()
    return {"message": "Route deleted"}


@router.get("/equipments", response_model=List[EquipmentResponse])
def get_equipments(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "活动领队"]))
):
    query = db.query(Equipment)
    if category:
        query = query.filter(Equipment.category == category)
    if status:
        query = query.filter(Equipment.status == status)
    return query.all()


@router.post("/equipments", response_model=EquipmentResponse)
def create_equipment(
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_equipment = Equipment(**equipment.dict())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


@router.put("/equipments/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: int,
    equipment: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for key, value in equipment.dict(exclude_unset=True).items():
        setattr(db_equipment, key, value)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


@router.delete("/equipments/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(db_equipment)
    db.commit()
    return {"message": "Equipment deleted"}


@router.get("/inspection-cycles", response_model=List[InspectionCycleResponse])
def get_inspection_cycles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员"]))
):
    return db.query(InspectionCycle).all()


@router.post("/inspection-cycles", response_model=InspectionCycleResponse)
def create_inspection_cycle(
    cycle: InspectionCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_cycle = InspectionCycle(**cycle.dict())
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle


@router.put("/inspection-cycles/{cycle_id}", response_model=InspectionCycleResponse)
def update_inspection_cycle(
    cycle_id: int,
    cycle: InspectionCycleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员"]))
):
    db_cycle = db.query(InspectionCycle).filter(InspectionCycle.id == cycle_id).first()
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    for key, value in cycle.dict(exclude_unset=True).items():
        setattr(db_cycle, key, value)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle
