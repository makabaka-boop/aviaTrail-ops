from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ActivityBatch(Base):
    __tablename__ = "activity_batches"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("activity_routes.id"))
    leader_id = Column(Integer, ForeignKey("users.id"))
    batch_name = Column(String)
    people_count = Column(Integer)
    activity_date = Column(DateTime)
    start_time = Column(String)
    end_time = Column(String)
    status = Column(String, default="已登记")
    notes = Column(Text)
    risk_level = Column(String, default="无")
    risk_summary = Column(Text)
    risk_confirmed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    route = relationship("ActivityRoute", back_populates="batches")
    leader = relationship("User")
    route_changes = relationship("RouteChange", back_populates="batch")
    feedbacks = relationship("Feedback", back_populates="batch")


class RouteChange(Base):
    __tablename__ = "route_changes"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("activity_batches.id"))
    original_route_id = Column(Integer)
    new_route_description = Column(Text)
    reason = Column(Text)
    change_time = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("ActivityBatch", back_populates="route_changes")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("activity_batches.id"))
    leader_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)
    content = Column(Text)
    issues_encountered = Column(Text)
    suggestions = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("ActivityBatch", back_populates="feedbacks")
