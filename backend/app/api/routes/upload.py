"""
Upload API Routes
Handles CSV file uploads for tasks.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import List

from ...models.task import TaskCreate


router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file containing tasks.
    
    Expected CSV format:
    task_id,duration,deadline,predecessors,resource_cpu,resource_person
    
    Returns:
        JSON with parsed tasks
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read file content
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate required columns
        required_cols = ['task_id', 'duration']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {missing_cols}"
            )
        
        # Parse tasks
        tasks = []
        for _, row in df.iterrows():
            task = {
                'task_id': str(row['task_id']),
                'duration': float(row['duration']),
                'deadline': float(row['deadline']) if 'deadline' in df.columns and pd.notna(row['deadline']) else None,
                'predecessors': str(row['predecessors']) if 'predecessors' in df.columns and pd.notna(row['predecessors']) else "",
                'resource_cpu': float(row['resource_cpu']) if 'resource_cpu' in df.columns and pd.notna(row['resource_cpu']) else 0.0,
                'resource_person': float(row['resource_person']) if 'resource_person' in df.columns and pd.notna(row['resource_person']) else 0.0,
            }
            tasks.append(task)
        
        return {
            "message": f"Successfully uploaded {len(tasks)} tasks",
            "tasks": tasks,
            "filename": file.filename
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Invalid CSV format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/json")
async def upload_json(tasks: List[dict]):
    """
    Upload tasks directly as JSON.
    
    Returns:
        JSON with confirmation
    """
    return {
        "message": f"Successfully received {len(tasks)} tasks",
        "tasks": tasks
    }
