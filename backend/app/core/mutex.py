"""
Resource Mutex Module
Handles resource constraints and conflicts between tasks.
"""
from typing import List, Dict, Set, Tuple
from dataclasses import dataclass


@dataclass
class ResourceUsage:
    """Resource requirements for a task."""
    cpu: float
    person: float


class ResourceMutex:
    """
    Manages resource mutexes to prevent over-allocation.
    Tracks CPU and person resources across parallel tasks.
    """
    
    def __init__(self, max_cpu: float = 4.0, max_person: float = 4.0):
        """
        Initialize resource limits.
        
        Args:
            max_cpu: Maximum available CPU units
            max_person: Maximum available person resources
        """
        self.max_cpu = max_cpu
        self.max_person = max_person
    
    def check_conflict(self, task1_resources: ResourceUsage, 
                       task2_resources: ResourceUsage) -> bool:
        """
        Check if two tasks have resource conflicts.
        
        Returns:
            True if tasks conflict (cannot run in parallel)
        """
        total_cpu = task1_resources.cpu + task2_resources.cpu
        total_person = task1_resources.person + task2_resources.person
        
        return total_cpu > self.max_cpu or total_person > self.max_person
    
    def find_mutex_pairs(self, tasks: Dict[str, ResourceUsage]) -> Set[Tuple[str, str]]:
        """
        Find all pairs of tasks that cannot run in parallel due to resources.
        
        Args:
            tasks: Dict mapping task_id to ResourceUsage
            
        Returns:
            Set of tuples (task_id1, task_id2) that are mutex
        """
        mutex_pairs = set()
        task_ids = list(tasks.keys())
        
        for i, task1 in enumerate(task_ids):
            for task2 in task_ids[i + 1:]:
                if self.check_conflict(tasks[task1], tasks[task2]):
                    # Store sorted tuple to avoid duplicates
                    pair = tuple(sorted([task1, task2]))
                    mutex_pairs.add(pair)
        
        return mutex_pairs
    
    def can_schedule_together(self, task_group: List[str],
                              tasks: Dict[str, ResourceUsage]) -> bool:
        """
        Check if a group of tasks can be scheduled in the same wave.
        
        Args:
            task_group: List of task IDs to check
            tasks: Dict mapping task_id to ResourceUsage
            
        Returns:
            True if all tasks can run in parallel
        """
        total_cpu = sum(tasks[tid].cpu for tid in task_group if tid in tasks)
        total_person = sum(tasks[tid].person for tid in task_group if tid in tasks)
        
        return total_cpu <= self.max_cpu and total_person <= self.max_person
