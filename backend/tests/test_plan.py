"""
Unit tests for the planning engine.
"""
import pytest
from app.core.graphplan import GraphPlan
from app.core.mutex import ResourceMutex, ResourceUsage
from app.models.task import Task


class TestResourceMutex:
    """Tests for resource mutex handling."""
    
    def test_no_conflict(self):
        mutex = ResourceMutex(max_cpu=4.0, max_person=4.0)
        r1 = ResourceUsage(cpu=1.0, person=1.0)
        r2 = ResourceUsage(cpu=1.0, person=1.0)
        assert not mutex.check_conflict(r1, r2)
    
    def test_cpu_conflict(self):
        mutex = ResourceMutex(max_cpu=4.0, max_person=4.0)
        r1 = ResourceUsage(cpu=3.0, person=1.0)
        r2 = ResourceUsage(cpu=2.0, person=1.0)
        assert mutex.check_conflict(r1, r2)
    
    def test_person_conflict(self):
        mutex = ResourceMutex(max_cpu=4.0, max_person=4.0)
        r1 = ResourceUsage(cpu=1.0, person=3.0)
        r2 = ResourceUsage(cpu=1.0, person=2.0)
        assert mutex.check_conflict(r1, r2)
    
    def test_find_mutex_pairs(self):
        mutex = ResourceMutex(max_cpu=4.0, max_person=4.0)
        tasks = {
            'A': ResourceUsage(cpu=3.0, person=1.0),
            'B': ResourceUsage(cpu=3.0, person=1.0),
            'C': ResourceUsage(cpu=1.0, person=1.0),
        }
        pairs = mutex.find_mutex_pairs(tasks)
        assert ('A', 'B') in pairs or ('B', 'A') in pairs


class TestGraphPlan:
    """Tests for GraphPlan algorithm."""
    
    def test_simple_plan(self):
        """Test planning with independent tasks."""
        gp = GraphPlan(max_cpu=4.0, max_person=4.0)
        
        tasks = [
            Task(task_id='A', duration=60, predecessors=[], resource_cpu=1, resource_person=1),
            Task(task_id='B', duration=30, predecessors=[], resource_cpu=1, resource_person=1),
        ]
        
        plan = gp.build_plan(tasks)
        
        assert len(plan.waves) >= 1
        assert plan.total_makespan > 0
        assert 'A' in plan.tasks
        assert 'B' in plan.tasks
    
    def test_dependency_plan(self):
        """Test planning with dependencies."""
        gp = GraphPlan(max_cpu=4.0, max_person=4.0)
        
        tasks = [
            Task(task_id='A', duration=60, predecessors=[], resource_cpu=1, resource_person=1),
            Task(task_id='B', duration=30, predecessors=['A'], resource_cpu=1, resource_person=1),
        ]
        
        plan = gp.build_plan(tasks)
        
        # B should be in a later wave than A
        wave_a = None
        wave_b = None
        for wave in plan.waves:
            if 'A' in wave.tasks:
                wave_a = wave.wave_id
            if 'B' in wave.tasks:
                wave_b = wave.wave_id
        
        assert wave_a is not None
        assert wave_b is not None
        assert wave_b > wave_a
    
    def test_resource_constraints(self):
        """Test planning respects resource limits."""
        gp = GraphPlan(max_cpu=2.0, max_person=2.0)
        
        tasks = [
            Task(task_id='A', duration=60, predecessors=[], resource_cpu=2, resource_person=1),
            Task(task_id='B', duration=30, predecessors=[], resource_cpu=2, resource_person=1),
        ]
        
        plan = gp.build_plan(tasks)
        
        # Should be in different waves due to resource constraints
        assert len(plan.waves) >= 2


class TestAPI:
    """Tests for API endpoints."""
    
    def test_health_check(self, client):
        """Test health endpoint."""
        # This would require a test client setup
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
