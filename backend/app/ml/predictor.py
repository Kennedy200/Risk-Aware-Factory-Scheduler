"""
Duration Predictor Module
Loads trained model and makes predictions for tasks.
"""
import joblib
import numpy as np
import pandas as pd
import os
from typing import Dict, List, Optional
from pathlib import Path

from ..models.task import Task


class DurationPredictor:
    """
    Predicts task durations and risk scores using trained Random Forest.
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize predictor with trained model.
        
        Args:
            model_path: Path to saved model file
        """
        if model_path is None:
            # Get absolute path to model
            current_file = os.path.abspath(__file__)
            # backend/app/ml/predictor.py -> go up 4 levels to project root
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
            model_path = os.path.join(project_root, 'ml-data', 'models', 'duration_predictor.pkl')
        
        self.model_path = model_path
        self.model = None
        self.feature_names = None
        self._load_model()
    
    def _load_model(self) -> None:
        """Load trained model from disk."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                "Run 'python -m app.ml.train' first."
            )
        
        data = joblib.load(self.model_path)
        self.model = data['model']
        self.feature_names = data['feature_names']
    
    def _extract_features(self, task: Task) -> pd.DataFrame:
        """
        Extract features from task for prediction.
        
        Args:
            task: Task object
            
        Returns:
            DataFrame with features
        """
        # Default feature values
        features = {
            'complexity': 5,  # Default medium complexity
            'team_size': int(task.resource_person) or 1,
            'resource_cpu': task.resource_cpu,
            'resource_person': task.resource_person,
            'has_dependencies': 1 if task.predecessors else 0,
            'estimated_duration': task.duration,
        }
        
        # Add task type features (one-hot encoded)
        for col in self.feature_names:
            if col.startswith('type_'):
                features[col] = 1 if col == 'type_dev' else 0
        
        # Create DataFrame with correct column order
        df = pd.DataFrame([features])
        
        # Ensure all feature columns exist
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0
        
        return df[self.feature_names]
    
    def predict_duration(self, task: Task) -> float:
        """
        Predict duration for a single task.
        
        Args:
            task: Task to predict
            
        Returns:
            Predicted duration in minutes
        """
        features = self._extract_features(task)
        prediction = self.model.predict(features)[0]
        return max(prediction, 1.0)  # Ensure positive duration
    
    def predict_batch(self, tasks: List[Task]) -> Dict[str, float]:
        """
        Predict durations for multiple tasks.
        
        Args:
            tasks: List of tasks to predict
            
        Returns:
            Dict mapping task_id to predicted duration
        """
        predictions = {}
        for task in tasks:
            predictions[task.task_id] = self.predict_duration(task)
        return predictions
    
    def calculate_risk(self, task: Task, predicted_duration: float) -> float:
        """
        Calculate risk score based on prediction uncertainty.
        
        Risk is higher when:
        - Predicted duration is much longer than estimated
        - Task has many dependencies
        - Resource requirements are high
        
        Args:
            task: Task object
            predicted_duration: Predicted duration
            
        Returns:
            Risk score between 0 and 1
        """
        # Base risk from duration difference
        if task.duration > 0:
            duration_ratio = predicted_duration / task.duration
        else:
            duration_ratio = 1.0
        
        duration_risk = min(max((duration_ratio - 0.8) / 1.2, 0), 1)
        
        # Dependency risk
        dep_risk = min(len(task.predecessors) * 0.1, 0.3)
        
        # Resource risk
        resource_risk = min(
            (task.resource_cpu + task.resource_person) / 8, 
            0.3
        )
        
        # Combine risks
        total_risk = duration_risk * 0.5 + dep_risk * 0.25 + resource_risk * 0.25
        
        return min(max(total_risk, 0), 1)
    
    def enrich_tasks(self, tasks: List[Task]) -> List[Task]:
        """
        Enrich tasks with predicted durations and risk scores.
        
        Args:
            tasks: List of tasks to enrich
            
        Returns:
            List of tasks with predictions added
        """
        enriched = []
        for task in tasks:
            predicted = self.predict_duration(task)
            risk = self.calculate_risk(task, predicted)
            
            enriched_task = Task(
                task_id=task.task_id,
                duration=task.duration,
                deadline=task.deadline,
                predecessors=task.predecessors,
                resource_cpu=task.resource_cpu,
                resource_person=task.resource_person,
                risk_score=risk,
                predicted_duration=predicted
            )
            enriched.append(enriched_task)
        
        return enriched
