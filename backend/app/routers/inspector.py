from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, TrailSegment, ObservationPoint, InspectionRecord, InspectionCycle
from app.schemas.inspection import InspectionRecordCreate, InspectionRecordResponse
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/inspector", tags=["巡看人员"])


@router.get("/pending-segments", response_model=List[dict])
def get_pending_segments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["巡看人员", "管理员"]))
):
    today = datetime.now()
    cycles = db.query(InspectionCycle).all()
    pending_segments = []
    
    for cycle in cycles:
        if cycle.next_inspection_date and cycle.next_inspection_date <= today:
            segment = db.query(TrailSegment).filter(TrailSegment.id == cycle.segment_id).first()
            if segment:
                pending_segments.append({
                    "segment_id": segment.id,
                    "segment_name": segment.name,
                    "next_inspection_date": cycle.next_inspection_date,
                    "is_overdue": cycle.next_inspection_date < today,
                    "status": segment.status
                })
    
    return pending_segments


@router.get("/inspection-records", response_model=List[dict])
def get_inspection_records(
    segment_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["巡看人员", "管理员"]))
):
    query = db.query(InspectionRecord).join(User).join(TrailSegment)
    
    if segment_id:
        query = query.filter(InspectionRecord.segment_id == segment_id)
    if start_date:
        query = query.filter(InspectionRecord.inspection_date >= start_date)
    if end_date:
        query = query.filter(InspectionRecord.inspection_date <= end_date + ' 23:59:59')
    if status:
        query = query.filter(InspectionRecord.overall_status == status)
    
    records = query.order_by(InspectionRecord.inspection_date.desc()).all()
    
    return [{
        "id": r.id,
        "segment_id": r.segment_id,
        "segment_name": r.segment.name,
        "inspector_id": r.inspector_id,
        "inspector_name": r.inspector.full_name,
        "inspection_date": r.inspection_date,
        "obstruction_status": r.obstruction_status,
        "slippery_warning": r.slippery_warning,
        "bleachers_status": r.bleachers_status,
        "overall_status": r.overall_status,
        "suggestions": r.suggestions
    } for r in records]


@router.post("/inspection-records", response_model=InspectionRecordResponse)
def create_inspection_record(
    record: InspectionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["巡看人员", "管理员"]))
):
    db_record = InspectionRecord(
        **record.dict(),
        inspector_id=current_user.id
    )
    db.add(db_record)
    
    segment = db.query(TrailSegment).filter(TrailSegment.id == record.segment_id).first()
    if segment and record.overall_status:
        segment.status = record.overall_status
    
    cycle = db.query(InspectionCycle).filter(InspectionCycle.segment_id == record.segment_id).first()
    if cycle:
        cycle.last_inspection_date = datetime.now()
        cycle.next_inspection_date = datetime.now() + timedelta(days=cycle.cycle_days)
    
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/observation-points/{segment_id}", response_model=List[dict])
def get_segment_observation_points(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["巡看人员", "管理员"]))
):
    points = db.query(ObservationPoint).filter(ObservationPoint.segment_id == segment_id).all()
    return [{
        "id": p.id,
        "name": p.name,
        "has_bleachers": p.has_bleachers,
        "bleachers_status": p.bleachers_status,
        "status": p.status,
        "description": p.description
    } for p in points]


@router.put("/observation-points/{point_id}/status")
def update_observation_point_status(
    point_id: int,
    status: str = Query(...),
    bleachers_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["巡看人员", "管理员"]))
):
    point = db.query(ObservationPoint).filter(ObservationPoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    
    point.status = status
    if bleachers_status:
        point.bleachers_status = bleachers_status
    
    db.commit()
    return {"message": "Status updated"}
