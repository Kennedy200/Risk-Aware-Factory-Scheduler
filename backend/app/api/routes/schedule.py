"""
Schedule API Routes
Handles schedule generation and plan retrieval.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict
from sqlalchemy.orm import Session
import pandas as pd
import io

from ...models.task import Task
from ...models.plan import Plan
from ...core.graphplan import GraphPlan
from ...ml.predictor import DurationPredictor
from ...db.database import get_db
from ...db import crud


router = APIRouter(prefix="/api", tags=["schedule"])

# Note: Plans are now stored in SQLite database
# Keeping minimal in-memory cache for quick access
plans_cache: Dict[str, Plan] = {}

# Initialize components
predictor = None
graphplan = None


def get_predictor() -> DurationPredictor:
    """Get or create predictor instance."""
    global predictor
    if predictor is None:
        try:
            predictor = DurationPredictor()
        except FileNotFoundError:
            raise HTTPException(
                status_code=503,
                detail="ML model not trained. Run 'python -m app.ml.train' first."
            )
    return predictor


def get_graphplan() -> GraphPlan:
    """Get or create GraphPlan instance."""
    global graphplan
    if graphplan is None:
        graphplan = GraphPlan(max_cpu=4.0, max_person=4.0)
    return graphplan


@router.post("/schedule")
async def create_schedule(tasks_data: List[dict], db: Session = Depends(get_db)):
    """
    Generate a schedule from tasks.
    
    Args:
        tasks_data: List of task dictionaries
        
    Returns:
        Plan with waves, timing, and risk analysis
    """
    try:
        # Convert dicts to Task objects
        tasks = []
        for data in tasks_data:
            predecessors = []
            if data.get('predecessors'):
                preds = str(data['predecessors'])
                predecessors = [p.strip() for p in preds.split(',') if p.strip()]
            
            task = Task(
                task_id=str(data['task_id']),
                duration=float(data['duration']),
                deadline=float(data['deadline']) if data.get('deadline') else None,
                predecessors=predecessors,
                resource_cpu=float(data.get('resource_cpu', 0)),
                resource_person=float(data.get('resource_person', 0))
            )
            tasks.append(task)
        
        # Get ML predictions
        pred = get_predictor()
        enriched_tasks = pred.enrich_tasks(tasks)
        
        # Build plan with GraphPlan
        gp = get_graphplan()
        plan = gp.build_plan(enriched_tasks)
        
        # Store plan in database
        crud.create_plan(db, plan, max_cpu=4.0, max_person=4.0)
        plans_cache[plan.plan_id] = plan
        
        return plan
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/{plan_id}")
async def get_schedule(plan_id: str, db: Session = Depends(get_db)):
    """
    Retrieve a previously generated plan.
    
    Args:
        plan_id: ID of the plan to retrieve
        
    Returns:
        Plan object
    """
    # Check cache first
    if plan_id in plans_cache:
        return plans_cache[plan_id]
    
    # Get from database
    db_plan = crud.get_plan(db, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Convert to Pydantic model
    plan = crud.plan_to_pydantic(db_plan)
    plans_cache[plan_id] = plan
    return plan


@router.get("/download/{plan_id}")
async def download_schedule(plan_id: str, db: Session = Depends(get_db)):
    """
    Download plan as CSV.
    
    Args:
        plan_id: ID of the plan to download
        
    Returns:
        CSV file content
    """
    # Get plan (from cache or database)
    if plan_id in plans_cache:
        plan = plans_cache[plan_id]
    else:
        db_plan = crud.get_plan(db, plan_id)
        if not db_plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        plan = crud.plan_to_pydantic(db_plan)
    
    # Create CSV
    rows = []
    for wave in plan.waves:
        for task_id in wave.tasks:
            task_info = plan.tasks.get(task_id, {})
            rows.append({
                'wave': wave.wave_id,
                'task_id': task_id,
                'start_time': wave.start_time,
                'end_time': wave.end_time,
                'duration': task_info.get('duration', 0),
                'predicted_duration': task_info.get('predicted_duration', 0),
                'risk_score': task_info.get('risk_score', 0),
                'cpu': task_info.get('resources', {}).get('cpu', 0),
                'person': task_info.get('resources', {}).get('person', 0),
            })
    
    df = pd.DataFrame(rows)
    csv_content = df.to_csv(index=False)
    
    return {
        "filename": f"schedule_{plan_id}.csv",
        "content": csv_content
    }


@router.get("/plans")
async def list_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all stored plans.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records
        
    Returns:
        List of plan summaries
    """
    db_plans = crud.get_plans(db, skip=skip, limit=limit)
    
    return [
        {
            "plan_id": p.plan_id,
            "created_at": p.created_at,
            "total_makespan": p.total_makespan,
            "avg_risk": p.avg_risk,
            "task_count": len(p.tasks)
        }
        for p in db_plans
    ]


@router.delete("/schedule/{plan_id}")
async def delete_schedule(plan_id: str, db: Session = Depends(get_db)):
    """
    Delete a plan by ID.
    
    Args:
        plan_id: ID of the plan to delete
        
    Returns:
        Success message
    """
    success = crud.delete_plan(db, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Remove from cache if present
    if plan_id in plans_cache:
        del plans_cache[plan_id]
    
    return {"message": f"Plan {plan_id} deleted successfully"}


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    # Count plans in database
    plan_count = db.query(crud.models.PlanDB).count()
    
    return {
        "status": "healthy",
        "model_loaded": predictor is not None,
        "plans_stored": plan_count,
        "database": "connected"
    }
