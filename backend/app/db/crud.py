"""
CRUD operations for database models.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from . import models
from ..models.task import Task
from ..models.plan import Plan, Wave


def create_plan(db: Session, plan: Plan, max_cpu: float = 4.0, max_person: float = 4.0) -> models.PlanDB:
    """
    Create a new plan in the database.
    
    Args:
        db: Database session
        plan: Plan pydantic model
        max_cpu: Maximum CPU resources
        max_person: Maximum person resources
        
    Returns:
        Created PlanDB object
    """
    # Create plan record
    db_plan = models.PlanDB(
        plan_id=plan.plan_id,
        created_at=plan.created_at,
        total_makespan=plan.total_makespan,
        avg_risk=plan.avg_risk,
        max_cpu=max_cpu,
        max_person=max_person
    )
    db_plan.set_high_risk_list(plan.high_risk_tasks)
    
    db.add(db_plan)
    db.flush()  # Get plan.id
    
    # Create task records
    for wave in plan.waves:
        for task_id in wave.tasks:
            task_info = plan.tasks.get(task_id, {})
            
            db_task = models.TaskDB(
                task_id=task_id,
                plan_id=plan.plan_id,
                duration=task_info.get('duration', 0),
                predicted_duration=task_info.get('predicted_duration'),
                deadline=None,  # Not stored in plan currently
                predecessors=json.dumps(task_info.get('predecessors', [])),
                resource_cpu=task_info.get('resources', {}).get('cpu', 0),
                resource_person=task_info.get('resources', {}).get('person', 0),
                risk_score=task_info.get('risk_score'),
                start_time=wave.start_time,
                end_time=wave.end_time,
                wave_id=wave.wave_id
            )
            db.add(db_task)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan


def get_plan(db: Session, plan_id: str) -> Optional[models.PlanDB]:
    """
    Get plan by ID.
    
    Args:
        db: Database session
        plan_id: Plan ID string
        
    Returns:
        PlanDB object or None
    """
    return db.query(models.PlanDB).filter(models.PlanDB.plan_id == plan_id).first()


def get_plans(db: Session, skip: int = 0, limit: int = 100) -> List[models.PlanDB]:
    """
    Get list of plans with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records
        
    Returns:
        List of PlanDB objects
    """
    return db.query(models.PlanDB).order_by(
        models.PlanDB.created_at.desc()
    ).offset(skip).limit(limit).all()


def delete_plan(db: Session, plan_id: str) -> bool:
    """
    Delete a plan by ID.
    
    Args:
        db: Database session
        plan_id: Plan ID string
        
    Returns:
        True if deleted, False if not found
    """
    db_plan = get_plan(db, plan_id)
    if db_plan:
        db.delete(db_plan)
        db.commit()
        return True
    return False


def plan_to_pydantic(db_plan: models.PlanDB) -> Plan:
    """
    Convert database plan to Pydantic model.
    
    Args:
        db_plan: PlanDB object
        
    Returns:
        Plan Pydantic model
    """
    # Group tasks by wave
    waves_dict = {}
    tasks_dict = {}
    
    for task in db_plan.tasks:
        # Add to wave
        if task.wave_id not in waves_dict:
            waves_dict[task.wave_id] = {
                'tasks': [],
                'start_time': task.start_time or 0,
                'end_time': task.end_time or 0
            }
        waves_dict[task.wave_id]['tasks'].append(task.task_id)
        
        # Add task details
        tasks_dict[task.task_id] = {
            'duration': task.duration,
            'predicted_duration': task.predicted_duration,
            'risk_score': task.risk_score,
            'resources': {
                'cpu': task.resource_cpu,
                'person': task.resource_person
            },
            'predecessors': task.get_predecessors_list(),
            'end_time': task.end_time or 0
        }
    
    # Create waves list
    waves = [
        Wave(
            wave_id=wave_id,
            tasks=wave_data['tasks'],
            start_time=wave_data['start_time'],
            end_time=wave_data['end_time']
        )
        for wave_id, wave_data in sorted(waves_dict.items())
    ]
    
    return Plan(
        plan_id=db_plan.plan_id,
        created_at=db_plan.created_at,
        waves=waves,
        tasks=tasks_dict,
        total_makespan=db_plan.total_makespan,
        avg_risk=db_plan.avg_risk,
        high_risk_tasks=db_plan.get_high_risk_list()
    )


# Training data CRUD
def add_training_sample(
    db: Session,
    task_type: str,
    complexity: int,
    team_size: int,
    resource_cpu: float,
    resource_person: float,
    has_dependencies: bool,
    estimated_duration: float,
    actual_duration: float,
    project_id: str = None
) -> models.TrainingData:
    """
    Add a training data sample.
    
    Args:
        db: Database session
        ... feature values ...
        
    Returns:
        Created TrainingData object
    """
    db_sample = models.TrainingData(
        task_type=task_type,
        complexity=complexity,
        team_size=team_size,
        resource_cpu=resource_cpu,
        resource_person=resource_person,
        has_dependencies=1 if has_dependencies else 0,
        estimated_duration=estimated_duration,
        actual_duration=actual_duration,
        project_id=project_id
    )
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample


def get_training_data(db: Session, limit: int = 10000) -> List[models.TrainingData]:
    """
    Get all training data.
    
    Args:
        db: Database session
        limit: Maximum number of records
        
    Returns:
        List of TrainingData objects
    """
    return db.query(models.TrainingData).limit(limit).all()
