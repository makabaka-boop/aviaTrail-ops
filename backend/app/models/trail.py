from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TrailSegment(Base):
    __tablename__ = "trail_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    start_point = Column(String)
    end_point = Column(String)
    length_km = Column(Float)
    difficulty = Column(String)
    status = Column(String, default="正常开放")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    observation_points = relationship("ObservationPoint", back_populates="segment")
    inspection_records = relationship("InspectionRecord", back_populates="segment")


class ObservationPoint(Base):
    __tablename__ = "observation_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    segment_id = Column(Integer, ForeignKey("trail_segments.id"))
    description = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    has_bleachers = Column(Integer, default=0)
    bleachers_status = Column(String, default="正常")
    status = Column(String, default="正常开放")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    segment = relationship("TrailSegment", back_populates="observation_points")


class ActivityRoute(Base):
    __tablename__ = "activity_routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    segment_ids = Column(String)
    estimated_duration_minutes = Column(Integer)
    max_people = Column(Integer)
    difficulty = Column(String)
    status = Column(String, default="正常开放")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batches = relationship("ActivityBatch", back_populates="route")


class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    quantity = Column(Integer, default=0)
    location = Column(String)
    status = Column(String, default="良好")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class InspectionCycle(Base):
    __tablename__ = "inspection_cycles"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("trail_segments.id"))
    cycle_days = Column(Integer, default=7)
    last_inspection_date = Column(DateTime)
    next_inspection_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
