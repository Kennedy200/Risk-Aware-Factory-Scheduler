Here's the updated README with SQLite for simple persistence.

---

```markdown
# Task Scheduler with Planning Graphs

A web app that schedules tasks using the GraphPlan algorithm. Tasks have dependencies and resource constraints. The system finds which tasks can run in parallel.

**Stack:** FastAPI + SQLite (backend) + React (frontend)

---

## What It Does

1. You enter tasks with dependencies and resources
2. System saves to SQLite
3. GraphPlan algorithm builds waves (parallel groups)
4. Shows schedule: which tasks run together, total time

---

## The Core Idea: Planning Graph

Alternates between **states** (what's true) and **actions** (what you can do).

```

Level 0: [Task A pending, Resource free]
Level 1: [Start Task A] 
Level 2: [Task A done, Resource busy]
Level 3: [Start Task B] ← needs Task A

```

**Mutex:** Same resource can't be used twice in one wave.

---

## Simple Example

**Input:**
- Task A: 2 hours, needs Developer, no dependencies
- Task B: 1 hour, needs Developer, no dependencies  
- Task C: 3 hours, needs Tester, depends on A and B

**Output:**
```

Wave 1 (0-2h): Task A
Wave 2 (2-3h): Task B

Wave 3 (3-6h): Task C
Total: 6 hours

```

---

## System Parts

| Part | Tech | Job |
|------|------|-----|
| Backend API | FastAPI | Endpoints, database |
| Database | SQLite | Store projects, tasks, plans |
| Planning Engine | Python | GraphPlan algorithm |
| Frontend | React | Forms, display waves |

---

## Database Schema (SQLite)

```sql
-- One project = one scheduling problem
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources available in this project
CREATE TABLE resources (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name TEXT,
    quantity INTEGER
);

-- Tasks to schedule
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name TEXT,
    duration INTEGER,  -- minutes or hours
    resources TEXT     -- JSON: ["dev", "server"]
);

-- Dependencies: task_id needs prereq_task_id done first
CREATE TABLE dependencies (
    task_id INTEGER,
    prereq_task_id INTEGER,
    PRIMARY KEY (task_id, prereq_task_id)
);

-- Generated waves (the plan)
CREATE TABLE waves (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    wave_number INTEGER,
    start_time INTEGER,
    end_time INTEGER
);

-- Which tasks in which wave
CREATE TABLE wave_tasks (
    wave_id INTEGER,
    task_id INTEGER
);
```

---

API Endpoints

Method	Endpoint	Does	
POST	`/projects`	Create new project	
POST	`/projects/{id}/tasks`	Add task to project	
POST	`/projects/{id}/resources`	Define resources	
POST	`/projects/{id}/schedule`	Run GraphPlan, save waves	
GET	`/projects/{id}/plan`	Get waves with tasks	
GET	`/projects/{id}/tasks`	List all tasks	

---

Request/Response Examples

Create project:

```bash
POST /projects
{"name": "Website Build"}
# Returns: {"id": 1, "name": "Website Build"}
```

Add resources:

```bash
POST /projects/1/resources
[
  {"name": "dev", "quantity": 2},
  {"name": "designer", "quantity": 1}
]
```

Add tasks:

```bash
POST /projects/1/tasks
{
  "name": "Backend API",
  "duration": 120,
  "resources": ["dev"],
  "needs": []  # no dependencies
}
```

Generate schedule:

```bash
POST /projects/1/schedule
# Runs GraphPlan, saves to waves table
```

Get plan:

```bash
GET /projects/1/plan
# Returns:
{
  "project": "Website Build",
  "waves": [
    {
      "wave": 1,
      "start": 0,
      "end": 120,
      "tasks": [
        {"name": "Backend API", "duration": 120, "resources": ["dev"]}
      ]
    }
  ],
  "total_time": 120
}
```

---

Algorithm (Pseudocode)

```python
def schedule(project_id):
    tasks = get_tasks_from_db(project_id)
    resources = get_resources_from_db(project_id)
    
    waves = []
    done = set()
    time = 0
    
    while len(done) < len(tasks):
        # Find ready tasks (all dependencies satisfied)
        ready = []
        for task in tasks:
            if task.id in done:
                continue
            prereqs = get_prereqs(task.id)
            if prereqs <= done:
                ready.append(task)
        
        # Apply resource mutex
        wave_tasks = []
        used = {}  # resource -> count used
        
        for task in ready:
            can_run = True
            for res in task.resources:
                if used.get(res, 0) >= resources[res]:
                    can_run = False
                    break
            
            if can_run:
                wave_tasks.append(task)
                for res in task.resources:
                    used[res] = used.get(res, 0) + 1
        
        if not wave_tasks:
            return "Error: circular dependency or impossible"
        
        # Save wave to database
        max_dur = max(t.duration for t in wave_tasks)
        wave_id = insert_wave(project_id, len(waves)+1, time, time+max_dur)
        
        for task in wave_tasks:
            link_wave_task(wave_id, task.id)
        
        time += max_dur
        done.update(t.id for t in wave_tasks)
        waves.append(wave_tasks)
    
    return waves
```

---

Folder Structure

```
task-scheduler/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite connection, tables
│   ├── planner.py           # GraphPlan algorithm
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # fastapi, uvicorn, sqlalchemy
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router/main
│   │   ├── ProjectForm.jsx  # Create project
│   │   ├── TaskForm.jsx     # Add tasks
│   │   ├── ResourceForm.jsx # Add resources
│   │   ├── WaveView.jsx     # Display schedule
│   │   └── api.js           # Backend calls
│   └── package.json         # react, axios, react-router
└── README.md
```

---

Quick Start

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# Creates scheduler.db automatically
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

What Each Person Does (3 people)

Person	Files	Hours	
A - Database & API	`database.py`, `main.py` endpoints	6	
B - Planner	`planner.py`, mutex logic	6	
C - Frontend	All `.jsx` files, connecting to API	8	

---

For the Paper

Explain:
- GraphPlan levels and alternation
- Your mutex implementation (resource counting)
- SQLite schema design
- Example walkthrough showing waves

Show:
- Screenshot of waves display
- Database tables with sample data
- Time comparison: sequential vs parallel schedule

---

Checklist

- SQLite creates tables on first run
- Can create project, add tasks, add resources
- `/schedule` runs without error
- Waves saved to database
- Frontend shows wave list correctly
- Resource conflicts prevent parallel tasks

```

Want the actual SQLAlchemy models or the React component structure next