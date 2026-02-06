from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


class Wave(BaseModel):
    """A wave (layer) of tasks that can be executed in parallel."""
    wave_id: int
    tasks: List[str]
    start_time: float
    end_time: float


class Plan(BaseModel):
    """Complete schedule plan with waves and risk analysis."""
    plan_id: str
    created_at: datetime
    waves: List[Wave]
    tasks: Dict[str, dict]
    total_makespan: float
    avg_risk: float
    high_risk_tasks: List[str]


class PlanCreate(BaseModel):
    """Model for creating a new plan."""
    tasks: List[dict]
