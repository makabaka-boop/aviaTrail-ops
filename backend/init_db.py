from app.database import SessionLocal, engine, Base
from app.models import User, TrailSegment, ObservationPoint, ActivityRoute, Equipment, InspectionCycle
from app.auth import get_password_hash
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@birdwatch.com",
            full_name="系统管理员",
            role="管理员",
            hashed_password=get_password_hash("admin123")
        )
        db.add(admin)

    inspector = db.query(User).filter(User.username == "inspector1").first()
    if not inspector:
        inspector = User(
            username="inspector1",
            email="inspector1@birdwatch.com",
            full_name="张巡看",
            role="巡看人员",
            hashed_password=get_password_hash("inspector123")
        )
        db.add(inspector)

    leader = db.query(User).filter(User.username == "leader1").first()
    if not leader:
        leader = User(
            username="leader1",
            email="leader1@birdwatch.com",
            full_name="李领队",
            role="活动领队",
            hashed_password=get_password_hash("leader123")
        )
        db.add(leader)

    leader2 = db.query(User).filter(User.username == "leader2").first()
    if not leader2:
        leader2 = User(
            username="leader2",
            email="leader2@birdwatch.com",
            full_name="王领队",
            role="活动领队",
            hashed_password=get_password_hash("leader123")
        )
        db.add(leader2)

    inspector2 = db.query(User).filter(User.username == "inspector2").first()
    if not inspector2:
        inspector2 = User(
            username="inspector2",
            email="inspector2@birdwatch.com",
            full_name="刘巡看",
            role="巡看人员",
            hashed_password=get_password_hash("inspector123")
        )
        db.add(inspector2)

    db.commit()

    segments_data = [
        {"name": "东湖观鸟段", "description": "沿东湖西岸的观鸟步道，适合观察水鸟", "start_point": "东湖西门", "end_point": "观鸟亭", "length_km": 2.5, "difficulty": "简单", "status": "正常开放"},
        {"name": "山林穿越段", "description": "穿越山林的步道，适合观察林鸟", "start_point": "山脚下", "end_point": "山顶平台", "length_km": 3.8, "difficulty": "中等", "status": "正常开放"},
        {"name": "湿地探索段", "description": "湿地保护区内的观鸟步道", "start_point": "湿地入口", "end_point": "芦苇荡", "length_km": 1.8, "difficulty": "简单", "status": "正常开放"},
        {"name": "海岸线段", "description": "沿海岸线的观鸟路径", "start_point": "沙滩入口", "end_point": "礁石区", "length_km": 4.2, "difficulty": "困难", "status": "待巡看"},
    ]

    segments = []
    for seg_data in segments_data:
        seg = db.query(TrailSegment).filter(TrailSegment.name == seg_data["name"]).first()
        if not seg:
            seg = TrailSegment(**seg_data)
            db.add(seg)
            db.flush()
        segments.append(seg)

    db.commit()

    points_data = [
        {"name": "观鸟亭一号", "segment_id": segments[0].id, "description": "主要观察点，配备双筒望远镜", "latitude": 30.5, "longitude": 114.3, "has_bleachers": 1, "bleachers_status": "正常", "status": "正常开放"},
        {"name": "芦苇荡观察点", "segment_id": segments[0].id, "description": "适合观察秧鸡类鸟类", "latitude": 30.51, "longitude": 114.32, "has_bleachers": 0, "status": "正常开放"},
        {"name": "山林平台", "segment_id": segments[1].id, "description": "高处观察点，视野开阔", "latitude": 30.55, "longitude": 114.35, "has_bleachers": 1, "bleachers_status": "正常", "status": "正常开放"},
        {"name": "湿地中心", "segment_id": segments[2].id, "description": "湿地核心观察区", "latitude": 30.48, "longitude": 114.28, "has_bleachers": 1, "bleachers_status": "正常", "status": "正常开放"},
        {"name": "礁石观景点", "segment_id": segments[3].id, "description": "海边礁石区，适合观察海鸟", "latitude": 30.6, "longitude": 114.4, "has_bleachers": 0, "status": "待巡看"},
    ]

    for point_data in points_data:
        point = db.query(ObservationPoint).filter(ObservationPoint.name == point_data["name"]).first()
        if not point:
            point = ObservationPoint(**point_data)
            db.add(point)

    db.commit()

    routes_data = [
        {"name": "经典观鸟路线", "description": "东湖段+山林段的经典组合", "segment_ids": f"{segments[0].id},{segments[1].id}", "estimated_duration_minutes": 180, "max_people": 20, "difficulty": "中等", "status": "正常开放"},
        {"name": "湿地精华游", "description": "专注湿地观鸟的短途路线", "segment_ids": f"{segments[2].id}", "estimated_duration_minutes": 90, "max_people": 15, "difficulty": "简单", "status": "正常开放"},
        {"name": "全程挑战", "description": "包含所有路段的完整路线", "segment_ids": f"{segments[0].id},{segments[1].id},{segments[2].id},{segments[3].id}", "estimated_duration_minutes": 360, "max_people": 10, "difficulty": "困难", "status": "正常开放"},
    ]

    for route_data in routes_data:
        route = db.query(ActivityRoute).filter(ActivityRoute.name == route_data["name"]).first()
        if not route:
            route = ActivityRoute(**route_data)
            db.add(route)

    db.commit()

    equipment_data = [
        {"name": "双筒望远镜", "category": "观察设备", "quantity": 10, "location": "器材室A区", "status": "良好"},
        {"name": "单筒望远镜", "category": "观察设备", "quantity": 5, "location": "器材室A区", "status": "良好"},
        {"name": "防蛇靴", "category": "防护装备", "quantity": 20, "location": "器材室B区", "status": "良好"},
        {"name": "急救包", "category": "医疗用品", "quantity": 8, "location": "器材室C区", "status": "良好"},
        {"name": "对讲机", "category": "通讯设备", "quantity": 15, "location": "器材室A区", "status": "良好"},
        {"name": "防雨服", "category": "防护装备", "quantity": 25, "location": "器材室B区", "status": "需补充"},
    ]

    for equip_data in equipment_data:
        equip = db.query(Equipment).filter(Equipment.name == equip_data["name"]).first()
        if not equip:
            equip = Equipment(**equip_data)
            db.add(equip)

    db.commit()

    for i, seg in enumerate(segments):
        cycle = db.query(InspectionCycle).filter(InspectionCycle.segment_id == seg.id).first()
        if not cycle:
            days_offset = i * 2
            cycle = InspectionCycle(
                segment_id=seg.id,
                cycle_days=7,
                last_inspection_date=datetime.now() - timedelta(days=days_offset),
                next_inspection_date=datetime.now() + timedelta(days=7 - days_offset)
            )
            db.add(cycle)

    db.commit()

    print("数据库初始化完成！")
    print("测试账号：")
    print("  管理员: admin / admin123")
    print("  巡看人员: inspector1 / inspector123")
    print("  活动领队: leader1 / leader123")

except Exception as e:
    print(f"初始化失败: {e}")
    db.rollback()
finally:
    db.close()
