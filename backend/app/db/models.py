"""
SQLAlchemy database models.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import json

from .database import Base


class TaskDB(Base):
    """Database model for tasks."""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, index=True, nullable=False)
    plan_id = Column(String, ForeignKey("plans.plan_id"), nullable=False)
    
    # Task properties
    duration = Column(Float, nullable=False)
    predicted_duration = Column(Float, nullable=True)
    deadline = Column(Float, nullable=True)
    predecessors = Column(Text, default="")  # JSON list as string
    resource_cpu = Column(Float, default=0.0)
    resource_person = Column(Float, default=0.0)
    risk_score = Column(Float, nullable=True)
    
    # Timing
    start_time = Column(Float, nullable=True)
    end_time = Column(Float, nullable=True)
    wave_id = Column(Integer, nullable=True)
    
    # Relationships
    plan = relationship("PlanDB", back_populates="tasks")
    
    def get_predecessors_list(self):
        """Get predecessors as Python list."""
        if not self.predecessors:
            return []
        try:
            return json.loads(self.predecessors)
        except:
            return [p.strip() for p in self.predecessors.split(",") if p.strip()]
    
    def set_predecessors_list(self, pred_list):
        """Set predecessors from Python list."""
        if isinstance(pred_list, list):
            self.predecessors = json.dumps(pred_list)
        else:
            self.predecessors = str(pred_list)


class PlanDB(Base):
    """Database model for scheduling plans."""
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, unique=True, index=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    total_makespan = Column(Float, default=0.0)
    avg_risk = Column(Float, default=0.0)
    high_risk_tasks = Column(Text, default="")  # JSON list as string
    
    # Resource limits used
    max_cpu = Column(Float, default=4.0)
    max_person = Column(Float, default=4.0)
    
    # Relationships
    tasks = relationship("TaskDB", back_populates="plan", cascade="all, delete-orphan")
    
    def get_high_risk_list(self):
        """Get high risk tasks as Python list."""
        if not self.high_risk_tasks:
            return []
        try:
            return json.loads(self.high_risk_tasks)
        except:
            return []
    
    def set_high_risk_list(self, risk_list):
        """Set high risk tasks from Python list."""
        if isinstance(risk_list, list):
            self.high_risk_tasks = json.dumps(risk_list)
        else:
            self.high_risk_tasks = str(risk_list)


class TrainingData(Base):
    """Database model for ML training data."""
    __tablename__ = "training_data"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Features
    task_type = Column(String, nullable=False)
    complexity = Column(Integer, default=5)
    team_size = Column(Integer, default=1)
    resource_cpu = Column(Float, default=0.0)
    resource_person = Column(Float, default=0.0)
    has_dependencies = Column(Integer, default=0)
    estimated_duration = Column(Float, nullable=False)
    
    # Target
    actual_duration = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    project_id = Column(String, nullable=True)
