from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, ActivityBatch, ActivityRoute, RouteChange, Feedback, TrailSegment, ObservationPoint, InspectionRecord, InspectionCycle
from app.schemas.activity import (
    ActivityBatchCreate, ActivityBatchUpdate, ActivityBatchResponse,
    RouteChangeCreate, RouteChangeResponse,
    FeedbackCreate, FeedbackResponse,
    RouteRiskAssessment
)
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/leader", tags=["活动领队"])


@router.get("/route-risk/{route_id}", response_model=RouteRiskAssessment)
def get_route_risk(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    route = db.query(ActivityRoute).filter(ActivityRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    risk_factors = []
    suggestions = []
    needs_confirmation = False
    high_risk_count = 0
    medium_risk_count = 0

    if not route.segment_ids:
        return RouteRiskAssessment(
            route_id=route.id,
            route_name=route.name,
            risk_level="无",
            risk_factors=[],
            suggestions=[],
            needs_confirmation=False
        )

    segment_ids = [int(x) for x in route.segment_ids.split(',') if x.strip().isdigit()]
    today = datetime.now()

    for seg_id in segment_ids:
        segment = db.query(TrailSegment).filter(TrailSegment.id == seg_id).first()
        if not segment:
            continue

        if segment.status in ["维护处理中", "局部绕行"]:
            high_risk_count += 1
            needs_confirmation = True
            risk_factors.append({
                "type": "segment_status",
                "segment_id": segment.id,
                "segment_name": segment.name,
                "status": segment.status,
                "reason": f"步道分段「{segment.name}」当前状态为「{segment.status}」，不宜正常通行",
                "risk_level": "高"
            })
            if segment.status == "维护处理中":
                suggestions.append(f"建议绕过「{segment.name}」维护路段，或等待维护完成后再安排活动")
            elif segment.status == "局部绕行":
                suggestions.append(f"「{segment.name}」局部绕行中，请提前告知参与者绕行路线并预留额外时间")

        abnormal_points = db.query(ObservationPoint).filter(
            ObservationPoint.segment_id == seg_id,
            ObservationPoint.status != "正常开放"
        ).all()

        if abnormal_points:
            medium_risk_count += 1
            needs_confirmation = True
            point_names = "、".join([p.name for p in abnormal_points])
            point_statuses = "、".join([p.status for p in abnormal_points])
            risk_factors.append({
                "type": "abnormal_points",
                "segment_id": segment.id,
                "segment_name": segment.name,
                "abnormal_point_count": len(abnormal_points),
                "point_names": point_names,
                "reason": f"分段「{segment.name}」有{len(abnormal_points)}个异常观察点（{point_names}），状态为{point_statuses}",
                "risk_level": "中"
            })
            suggestions.append(f"请关注「{segment.name}」中的异常观察点（{point_names}），必要时调整观察计划")

        latest_record = db.query(InspectionRecord).filter(
            InspectionRecord.segment_id == seg_id
        ).order_by(InspectionRecord.inspection_date.desc()).first()

        if latest_record:
            if latest_record.overall_status != "正常开放":
                high_risk_count += 1
                needs_confirmation = True
                risk_factors.append({
                    "type": "inspection_status",
                    "segment_id": segment.id,
                    "segment_name": segment.name,
                    "inspection_date": latest_record.inspection_date.isoformat() if latest_record.inspection_date else None,
                    "overall_status": latest_record.overall_status,
                    "reason": f"分段「{segment.name}」最近一次巡看（{latest_record.inspection_date.strftime('%Y-%m-%d') if latest_record.inspection_date else '未知'}）状态为「{latest_record.overall_status}」",
                    "risk_level": "高"
                })
                suggestions.append(f"「{segment.name}」最近巡看结果异常，建议联系巡看人员确认当前状况后再决定")

            anomaly_items = []
            if latest_record.obstruction_status and latest_record.obstruction_status != "正常":
                anomaly_items.append(f"遮挡:{latest_record.obstruction_status}")
            if latest_record.slippery_warning == "有风险":
                anomaly_items.append(f"湿滑:{latest_record.slippery_warning}")
            if latest_record.bleachers_status and latest_record.bleachers_status != "正常":
                anomaly_items.append(f"看台:{latest_record.bleachers_status}")
            if anomaly_items:
                medium_risk_count += 1
                needs_confirmation = True
                risk_factors.append({
                    "type": "inspection_anomaly",
                    "segment_id": segment.id,
                    "segment_name": segment.name,
                    "inspection_date": latest_record.inspection_date.isoformat() if latest_record.inspection_date else None,
                    "anomaly_items": anomaly_items,
                    "reason": f"分段「{segment.name}」最近巡看发现异常：{'；'.join(anomaly_items)}",
                    "risk_level": "中"
                })
                if "湿滑" in str(anomaly_items):
                    suggestions.append(f"「{segment.name}」存在湿滑风险，建议提醒参与者注意防滑并准备防滑装备")
        else:
            medium_risk_count += 1
            risk_factors.append({
                "type": "no_inspection",
                "segment_id": segment.id,
                "segment_name": segment.name,
                "reason": f"分段「{segment.name}」暂无巡看记录，无法评估当前状况",
                "risk_level": "中"
            })
            suggestions.append(f"「{segment.name}」尚无巡看记录，建议先安排巡看确认安全后再活动")

        cycle = db.query(InspectionCycle).filter(InspectionCycle.segment_id == seg_id).first()
        if cycle and cycle.next_inspection_date:
            if cycle.next_inspection_date < today:
                days_overdue = (today - cycle.next_inspection_date).days
                medium_risk_count += 1
                needs_confirmation = True
                risk_factors.append({
                    "type": "overdue_inspection",
                    "segment_id": segment.id,
                    "segment_name": segment.name,
                    "days_overdue": days_overdue,
                    "next_inspection_date": cycle.next_inspection_date.isoformat() if cycle.next_inspection_date else None,
                    "reason": f"分段「{segment.name}」巡看已超期{days_overdue}天，最新状态未知",
                    "risk_level": "中" if days_overdue <= 7 else "高"
                })
                if days_overdue <= 7:
                    suggestions.append(f"「{segment.name}」巡看已超期{days_overdue}天，建议催促巡看人员尽快巡看")
                else:
                    suggestions.append(f"「{segment.name}」巡看严重超期{days_overdue}天，强烈建议巡看后再安排活动")
                    high_risk_count += 1
                    medium_risk_count -= 1

    cutoff_date = datetime.now() - timedelta(days=30)
    for seg_id in segment_ids:
        recent_anomaly_count = db.query(InspectionRecord).filter(
            InspectionRecord.segment_id == seg_id,
            InspectionRecord.inspection_date >= cutoff_date,
            or_(
                InspectionRecord.obstruction_status != "正常",
                InspectionRecord.slippery_warning == "有风险",
                InspectionRecord.bleachers_status != "正常"
            )
        ).count()

        if recent_anomaly_count >= 3:
            segment = db.query(TrailSegment).filter(TrailSegment.id == seg_id).first()
            if segment:
                high_risk_count += 1
                needs_confirmation = True
                risk_factors.append({
                    "type": "frequent_anomalies",
                    "segment_id": segment.id,
                    "segment_name": segment.name,
                    "recent_anomaly_count": recent_anomaly_count,
                    "reason": f"分段「{segment.name}」近30天内出现{recent_anomaly_count}次异常，属于高频异常路段",
                    "risk_level": "高"
                })
                suggestions.append(f"「{segment.name}」近期异常频繁，建议考虑更换路线或暂缓活动安排")

    if high_risk_count > 0:
        risk_level = "高"
    elif medium_risk_count > 0:
        risk_level = "中"
    else:
        risk_level = "无"
        needs_confirmation = False

    return RouteRiskAssessment(
        route_id=route.id,
        route_name=route.name,
        risk_level=risk_level,
        risk_factors=risk_factors,
        suggestions=suggestions,
        needs_confirmation=needs_confirmation
    )


@router.get("/batches", response_model=List[dict])
def get_batches(
    route_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    leader_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    query = db.query(ActivityBatch).join(ActivityRoute).join(User)
    
    if current_user.role == "活动领队":
        query = query.filter(ActivityBatch.leader_id == current_user.id)
    if route_id:
        query = query.filter(ActivityBatch.route_id == route_id)
    if start_date:
        query = query.filter(ActivityBatch.activity_date >= start_date)
    if end_date:
        next_day = (datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d')
        query = query.filter(ActivityBatch.activity_date < next_day)
    if status:
        query = query.filter(ActivityBatch.status == status)
    if leader_id:
        query = query.filter(ActivityBatch.leader_id == leader_id)
    
    batches = query.order_by(ActivityBatch.activity_date.desc()).all()
    
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
        "end_time": b.end_time,
        "status": b.status,
        "notes": b.notes,
        "risk_level": b.risk_level,
        "risk_summary": b.risk_summary,
        "risk_confirmed": b.risk_confirmed
    } for b in batches]


@router.post("/batches", response_model=ActivityBatchResponse)
def create_batch(
    batch: ActivityBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    route = db.query(ActivityRoute).filter(ActivityRoute.id == batch.route_id).first()
    if not route:
        raise HTTPException(status_code=400, detail="所选路线不存在")
    if route.max_people and batch.people_count > route.max_people:
        raise HTTPException(
            status_code=400,
            detail=f"参与人数({batch.people_count})超过路线最大人数({route.max_people})"
        )
    db_batch = ActivityBatch(
        **batch.dict(),
        leader_id=current_user.id
    )
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.put("/batches/{batch_id}", response_model=ActivityBatchResponse)
def update_batch(
    batch_id: int,
    batch: ActivityBatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    db_batch = db.query(ActivityBatch).filter(ActivityBatch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if current_user.role == "活动领队" and db_batch.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = batch.dict(exclude_unset=True)
    people_count = update_data.get('people_count', db_batch.people_count)
    route_id = update_data.get('route_id', db_batch.route_id)
    route = db.query(ActivityRoute).filter(ActivityRoute.id == route_id).first()
    if route and route.max_people and people_count > route.max_people:
        raise HTTPException(
            status_code=400,
            detail=f"参与人数({people_count})超过路线最大人数({route.max_people})"
        )

    for key, value in update_data.items():
        setattr(db_batch, key, value)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.get("/route-changes/{batch_id}", response_model=List[dict])
def get_route_changes(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    changes = db.query(RouteChange).filter(RouteChange.batch_id == batch_id).all()
    return [{
        "id": c.id,
        "batch_id": c.batch_id,
        "original_route_id": c.original_route_id,
        "new_route_description": c.new_route_description,
        "reason": c.reason,
        "change_time": c.change_time
    } for c in changes]


@router.post("/route-changes", response_model=RouteChangeResponse)
def create_route_change(
    change: RouteChangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    batch = db.query(ActivityBatch).filter(ActivityBatch.id == change.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if current_user.role == "活动领队" and batch.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_change = RouteChange(**change.dict())
    db.add(db_change)
    
    batch.status = "已改线"
    
    db.commit()
    db.refresh(db_change)
    return db_change


@router.get("/feedbacks/{batch_id}", response_model=List[dict])
def get_feedbacks(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    feedbacks = db.query(Feedback).filter(Feedback.batch_id == batch_id).join(User).all()
    return [{
        "id": f.id,
        "batch_id": f.batch_id,
        "leader_id": f.leader_id,
        "leader_name": f.batch.leader.full_name,
        "rating": f.rating,
        "content": f.content,
        "issues_encountered": f.issues_encountered,
        "suggestions": f.suggestions,
        "created_at": f.created_at
    } for f in feedbacks]


@router.post("/feedbacks", response_model=FeedbackResponse)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    batch = db.query(ActivityBatch).filter(ActivityBatch.id == feedback.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if current_user.role == "活动领队" and batch.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_feedback = Feedback(
        **feedback.dict(),
        leader_id=current_user.id
    )
    db.add(db_feedback)
    
    batch.status = "已完成"
    
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.get("/available-routes", response_model=List[dict])
def get_available_routes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["活动领队", "管理员"]))
):
    routes = db.query(ActivityRoute).filter(ActivityRoute.status == "正常开放").all()
    return [{
        "id": r.id,
        "name": r.name,
        "description": r.description,
        "estimated_duration_minutes": r.estimated_duration_minutes,
        "max_people": r.max_people,
        "difficulty": r.difficulty
    } for r in routes]
