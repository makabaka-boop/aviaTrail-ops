from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict
from app.database import get_db
from app.models import (
    User, TrailSegment, ObservationPoint, ActivityRoute,
    ActivityBatch, InspectionRecord, InspectionCycle, Feedback
)
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/dashboard", tags=["仪表板"])


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    total_segments = db.query(TrailSegment).count()
    total_points = db.query(ObservationPoint).count()
    total_routes = db.query(ActivityRoute).count()
    total_batches = db.query(ActivityBatch).count()
    total_inspections = db.query(InspectionRecord).count()
    
    status_counts = db.query(
        TrailSegment.status,
        func.count(TrailSegment.id)
    ).group_by(TrailSegment.status).all()
    
    return {
        "total_segments": total_segments,
        "total_points": total_points,
        "total_routes": total_routes,
        "total_batches": total_batches,
        "total_inspections": total_inspections,
        "status_distribution": {s: c for s, c in status_counts}
    }


@router.get("/route-heatmap")
def get_route_heatmap(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    query = db.query(
        ActivityRoute.id,
        ActivityRoute.name,
        func.count(ActivityBatch.id).label('batch_count'),
        func.sum(ActivityBatch.people_count).label('total_people')
    ).join(ActivityBatch, ActivityRoute.id == ActivityBatch.route_id, isouter=True)
    
    if start_date:
        query = query.filter(ActivityBatch.activity_date >= start_date)
    if end_date:
        query = query.filter(ActivityBatch.activity_date <= end_date)
    
    results = query.group_by(ActivityRoute.id, ActivityRoute.name).all()
    
    return [{
        "route_id": r.id,
        "route_name": r.name,
        "batch_count": r.batch_count or 0,
        "total_people": r.total_people or 0
    } for r in results]


@router.get("/anomaly-distribution")
def get_anomaly_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    anomalies = []
    
    obstruction_records = db.query(
        TrailSegment.name,
        func.count(InspectionRecord.id).label('count')
    ).join(InspectionRecord, TrailSegment.id == InspectionRecord.segment_id
    ).filter(InspectionRecord.obstruction_status != "正常"
    ).group_by(TrailSegment.name).all()
    
    slippery_records = db.query(
        TrailSegment.name,
        func.count(InspectionRecord.id).label('count')
    ).join(InspectionRecord, TrailSegment.id == InspectionRecord.segment_id
    ).filter(InspectionRecord.slippery_warning == "有风险"
    ).group_by(TrailSegment.name).all()
    
    bleachers_records = db.query(
        TrailSegment.name,
        func.count(InspectionRecord.id).label('count')
    ).join(InspectionRecord, TrailSegment.id == InspectionRecord.segment_id
    ).filter(InspectionRecord.bleachers_status != "正常"
    ).group_by(TrailSegment.name).all()
    
    return {
        "obstruction": {s: c for s, c in obstruction_records},
        "slippery": {s: c for s, c in slippery_records},
        "bleachers": {s: c for s, c in bleachers_records}
    }


@router.get("/inspection-workload")
def get_inspection_workload(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    query = db.query(
        User.id,
        User.full_name,
        func.count(InspectionRecord.id).label('inspection_count')
    ).join(InspectionRecord, User.id == InspectionRecord.inspector_id, isouter=True)
    
    if start_date:
        query = query.filter(InspectionRecord.inspection_date >= start_date)
    if end_date:
        query = query.filter(InspectionRecord.inspection_date <= end_date)
    
    results = query.group_by(User.id, User.full_name).filter(User.role == "巡看人员").all()
    
    return [{
        "inspector_id": r.id,
        "inspector_name": r.full_name,
        "inspection_count": r.inspection_count or 0
    } for r in results]


@router.get("/pending-points")
def get_pending_points(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    abnormal_segments = db.query(TrailSegment).filter(
        TrailSegment.status != "正常开放"
    ).all()
    
    abnormal_points = db.query(ObservationPoint).filter(
        ObservationPoint.status != "正常开放"
    ).all()
    
    today = datetime.now()
    overdue_cycles = db.query(InspectionCycle).filter(
        InspectionCycle.next_inspection_date < today
    ).all()
    
    overdue_segments = []
    for cycle in overdue_cycles:
        segment = db.query(TrailSegment).filter(TrailSegment.id == cycle.segment_id).first()
        if segment:
            overdue_segments.append({
                "segment_id": segment.id,
                "segment_name": segment.name,
                "next_inspection_date": cycle.next_inspection_date,
                "days_overdue": (today - cycle.next_inspection_date).days
            })
    
    return {
        "abnormal_segments": [{
            "id": s.id,
            "name": s.name,
            "status": s.status
        } for s in abnormal_segments],
        "abnormal_points": [{
            "id": p.id,
            "name": p.name,
            "segment_id": p.segment_id,
            "status": p.status
        } for p in abnormal_points],
        "overdue_inspections": overdue_segments
    }


@router.get("/high-frequency-anomalies")
def get_high_frequency_anomalies(
    threshold: int = 3,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    cutoff_date = datetime.now() - timedelta(days=days)
    
    results = db.query(
        TrailSegment.id,
        TrailSegment.name,
        func.count(InspectionRecord.id).label('anomaly_count')
    ).join(InspectionRecord, TrailSegment.id == InspectionRecord.segment_id
    ).filter(
        InspectionRecord.inspection_date >= cutoff_date,
        or_(
            InspectionRecord.obstruction_status != "正常",
            InspectionRecord.slippery_warning == "有风险",
            InspectionRecord.bleachers_status != "正常"
        )
    ).group_by(TrailSegment.id, TrailSegment.name
    ).having(func.count(InspectionRecord.id) >= threshold
    ).all()
    
    return [{
        "segment_id": r.id,
        "segment_name": r.name,
        "anomaly_count": r.anomaly_count
    } for r in results]


@router.get("/overdue-inspections")
def get_overdue_inspections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    today = datetime.now()
    
    overdue = db.query(InspectionCycle).filter(
        InspectionCycle.next_inspection_date < today
    ).all()
    
    result = []
    for cycle in overdue:
        segment = db.query(TrailSegment).filter(TrailSegment.id == cycle.segment_id).first()
        if segment:
            days_overdue = (today - cycle.next_inspection_date).days
            result.append({
                "segment_id": segment.id,
                "segment_name": segment.name,
                "last_inspection": cycle.last_inspection_date,
                "next_inspection": cycle.next_inspection_date,
                "days_overdue": days_overdue,
                "cycle_days": cycle.cycle_days
            })
    
    return result


@router.get("/activity-peak-hours")
def get_activity_peak_hours(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    cutoff_date = datetime.now() - timedelta(days=days)
    
    batches = db.query(ActivityBatch).filter(
        ActivityBatch.activity_date >= cutoff_date
    ).all()
    
    hour_distribution = defaultdict(int)
    
    for batch in batches:
        if batch.start_time:
            try:
                hour = int(batch.start_time.split(':')[0])
                hour_distribution[hour] += batch.people_count
            except:
                pass
    
    return [{
        "hour": h,
        "people_count": hour_distribution[h]
    } for h in sorted(hour_distribution.keys())]


@router.get("/risk-overlap")
def get_risk_overlap(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    today = datetime.now()

    abnormal_segments = db.query(TrailSegment).filter(
        TrailSegment.status != "正常开放"
    ).all()

    abnormal_segment_ids = [s.id for s in abnormal_segments]

    today_batches = db.query(ActivityBatch).filter(
        func.date(ActivityBatch.activity_date) == today.date()
    ).join(ActivityRoute).all()

    high_risk_batches = []
    for batch in today_batches:
        route = batch.route
        if route.segment_ids:
            segment_ids = [int(x) for x in route.segment_ids.split(',') if x.strip().isdigit()]
            overlap = set(segment_ids) & set(abnormal_segment_ids)
            if overlap:
                high_risk_batches.append({
                    "batch_id": batch.id,
                    "batch_name": batch.batch_name,
                    "route_name": route.name,
                    "people_count": batch.people_count,
                    "activity_date": batch.activity_date,
                    "start_time": batch.start_time,
                    "overlapping_segments": len(overlap),
                    "risk_level": "高" if len(overlap) >= 2 else "中",
                    "risk_summary": batch.risk_summary,
                    "risk_confirmed": batch.risk_confirmed
                })

    return high_risk_batches


@router.get("/risk-batches")
def get_risk_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["管理员", "巡看人员", "活动领队"]))
):
    risky_batches = db.query(ActivityBatch).filter(
        ActivityBatch.risk_level.in_(["高", "中"])
    ).join(ActivityRoute).join(User).order_by(ActivityBatch.activity_date.desc()).all()

    return [{
        "id": b.id,
        "batch_name": b.batch_name,
        "route_id": b.route_id,
        "route_name": b.route.name,
        "leader_id": b.leader_id,
        "leader_name": b.leader.full_name,
        "people_count": b.people_count,
        "activity_date": b.activity_date,
        "start_time": b.start_time,
        "status": b.status,
        "risk_level": b.risk_level,
        "risk_summary": b.risk_summary,
        "risk_confirmed": b.risk_confirmed
    } for b in risky_batches]
