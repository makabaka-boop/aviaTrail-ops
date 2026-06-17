from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("trail_segments.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    inspection_date = Column(DateTime(timezone=True), server_default=func.now())
    obstruction_status = Column(String)
    obstruction_details = Column(Text)
    slippery_warning = Column(String)
    slippery_details = Column(Text)
    bleachers_status = Column(String)
    bleachers_details = Column(Text)
    overall_status = Column(String, default="正常开放")
    suggestions = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    segment = relationship("TrailSegment", back_populates="inspection_records")
    inspector = relationship("User")
