from pydantic import BaseModel
from typing import Optional, List


class Task(BaseModel):
    """Task model representing a single job in the schedule."""
    task_id: str
    duration: float
    deadline: Optional[float] = None
    predecessors: List[str] = []
    resource_cpu: float = 0.0
    resource_person: float = 0.0
    risk_score: Optional[float] = None
    predicted_duration: Optional[float] = None


class TaskCreate(BaseModel):
    """Model for creating a new task."""
    task_id: str
    duration: float
    deadline: Optional[float] = None
    predecessors: str = ""  # Comma-separated list
    resource_cpu: float = 0.0
    resource_person: float = 0.0
