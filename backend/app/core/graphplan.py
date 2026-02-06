"""
GraphPlan Algorithm Implementation
Builds planning graph waves respecting dependencies and resource mutexes.
"""
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict, deque
from dataclasses import dataclass
import uuid
from datetime import datetime

from ..models.task import Task
from ..models.plan import Plan, Wave
from .mutex import ResourceMutex, ResourceUsage


@dataclass
class TaskNode:
    """Internal representation of a task in the planning graph."""
    task_id: str
    duration: float
    predecessors: Set[str]
    resources: ResourceUsage
    risk_score: float = 0.0
    predicted_duration: float = 0.0


class GraphPlan:
    """
    GraphPlan engine that builds scheduling waves.
    
    Algorithm:
    1. Build dependency graph from task predecessors
    2. Topologically sort tasks by dependencies
    3. Group tasks into waves where:
       - All dependencies are satisfied
       - No resource mutex conflicts exist
    4. Calculate start/end times for each wave
    """
    
    def __init__(self, max_cpu: float = 4.0, max_person: float = 4.0):
        """
        Initialize GraphPlan with resource constraints.
        
        Args:
            max_cpu: Maximum CPU resources available
            max_person: Maximum person resources available
        """
        self.mutex = ResourceMutex(max_cpu, max_person)
        self.tasks: Dict[str, TaskNode] = {}
    
    def load_tasks(self, tasks: List[Task]) -> None:
        """
        Load tasks into the planning graph.
        
        Args:
            tasks: List of Task objects
        """
        self.tasks = {}
        for task in tasks:
            self.tasks[task.task_id] = TaskNode(
                task_id=task.task_id,
                duration=task.predicted_duration or task.duration,
                predecessors=set(task.predecessors),
                resources=ResourceUsage(
                    cpu=task.resource_cpu,
                    person=task.resource_person
                ),
                risk_score=task.risk_score or 0.0,
                predicted_duration=task.predicted_duration or task.duration
            )
    
    def _get_dependency_levels(self) -> Dict[str, int]:
        """
        Calculate dependency level (depth) for each task.
        Level 0 = no predecessors, Level 1 = depends on level 0, etc.
        
        Returns:
            Dict mapping task_id to its dependency level
        """
        levels = {}
        
        # Initialize level 0 for tasks with no predecessors
        for task_id, node in self.tasks.items():
            if not node.predecessors:
                levels[task_id] = 0
        
        # BFS to calculate levels
        changed = True
        while changed:
            changed = False
            for task_id, node in self.tasks.items():
                if task_id in levels:
                    continue
                # Check if all predecessors have levels assigned
                if all(pred in levels for pred in node.predecessors):
                    max_pred_level = max(levels[pred] for pred in node.predecessors)
                    levels[task_id] = max_pred_level + 1
                    changed = True
        
        return levels
    
    def _build_waves(self, levels: Dict[str, int]) -> List[List[str]]:
        """
        Build waves (layers) of tasks that can execute in parallel.
        
        Args:
            levels: Dict mapping task_id to dependency level
            
        Returns:
            List of waves, where each wave is a list of task IDs
        """
        # Group tasks by level
        level_groups = defaultdict(list)
        for task_id, level in levels.items():
            level_groups[level].append(task_id)
        
        # Sort levels
        sorted_levels = sorted(level_groups.keys())
        
        waves = []
        for level in sorted_levels:
            candidates = level_groups[level]
            
            # Further split candidates into sub-waves based on resources
            sub_waves = self._split_by_resources(candidates)
            waves.extend(sub_waves)
        
        return waves
    
    def _split_by_resources(self, candidates: List[str]) -> List[List[str]]:
        """
        Split candidate tasks into sub-waves respecting resource constraints.
        Uses a greedy bin-packing approach.
        
        Args:
            candidates: List of task IDs at the same dependency level
            
        Returns:
            List of sub-waves (each sub-wave is a list of task IDs)
        """
        if not candidates:
            return []
        
        # Get resource usage for candidates
        task_resources = {
            tid: self.tasks[tid].resources 
            for tid in candidates
        }
        
        # Find mutex pairs
        mutex_pairs = self.mutex.find_mutex_pairs(task_resources)
        
        # Greedy grouping: try to pack as many non-conflicting tasks as possible
        remaining = set(candidates)
        sub_waves = []
        
        while remaining:
            current_wave = []
            wave_cpu = 0.0
            wave_person = 0.0
            
            # Sort by duration (longest first) for better packing
            sorted_remaining = sorted(
                remaining, 
                key=lambda t: self.tasks[t].duration, 
                reverse=True
            )
            
            for task_id in sorted_remaining:
                if task_id not in remaining:
                    continue
                    
                task = self.tasks[task_id]
                
                # Check if adding this task would exceed resources
                new_cpu = wave_cpu + task.resources.cpu
                new_person = wave_person + task.resources.person
                
                # Check mutex conflicts with tasks already in wave
                has_conflict = any(
                    tuple(sorted([task_id, other])) in mutex_pairs 
                    for other in current_wave
                )
                
                if not has_conflict and new_cpu <= self.mutex.max_cpu and new_person <= self.mutex.max_person:
                    current_wave.append(task_id)
                    wave_cpu = new_cpu
                    wave_person = new_person
            
            if current_wave:
                sub_waves.append(current_wave)
                remaining -= set(current_wave)
            else:
                # Should not happen, but prevent infinite loop
                sub_waves.append([sorted_remaining[0]])
                remaining.remove(sorted_remaining[0])
        
        return sub_waves
    
    def build_plan(self, tasks: List[Task]) -> Plan:
        """
        Build a complete schedule plan from tasks.
        
        Args:
            tasks: List of Task objects with predicted durations
            
        Returns:
            Plan object with waves, timing, and risk analysis
        """
        # Load tasks into the graph
        self.load_tasks(tasks)
        
        # Calculate dependency levels
        levels = self._get_dependency_levels()
        
        # Build waves
        wave_groups = self._build_waves(levels)
        
        # Calculate timing for each wave
        waves = []
        current_time = 0.0
        task_end_times = {}
        
        for wave_id, wave_tasks in enumerate(wave_groups):
            # Start time is max of predecessor end times
            wave_start = current_time
            
            # Calculate wave duration (max of task durations)
            wave_duration = max(
                self.tasks[tid].duration for tid in wave_tasks
            )
            
            wave_end = wave_start + wave_duration
            
            waves.append(Wave(
                wave_id=wave_id,
                tasks=wave_tasks,
                start_time=wave_start,
                end_time=wave_end
            ))
            
            # Record end times for tasks
            for tid in wave_tasks:
                task_end_times[tid] = wave_end
            
            current_time = wave_end
        
        # Calculate risk metrics
        all_risks = [self.tasks[tid].risk_score for tid in self.tasks]
        avg_risk = sum(all_risks) / len(all_risks) if all_risks else 0.0
        high_risk_tasks = [
            tid for tid in self.tasks 
            if self.tasks[tid].risk_score > 0.7
        ]
        
        # Build task details dict
        task_details = {}
        for tid, node in self.tasks.items():
            task_details[tid] = {
                "duration": node.duration,
                "predicted_duration": node.predicted_duration,
                "risk_score": node.risk_score,
                "resources": {
                    "cpu": node.resources.cpu,
                    "person": node.resources.person
                },
                "predecessors": list(node.predecessors),
                "end_time": task_end_times.get(tid, 0)
            }
        
        return Plan(
            plan_id=str(uuid.uuid4())[:8],
            created_at=datetime.now(),
            waves=waves,
            tasks=task_details,
            total_makespan=current_time,
            avg_risk=avg_risk,
            high_risk_tasks=high_risk_tasks
        )
