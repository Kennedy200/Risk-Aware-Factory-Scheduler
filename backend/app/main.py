"""
FastAPI Main Application
Entry point for the Risk-Aware Task Scheduler API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .api.routes.upload import router as upload_router
from .api.routes.schedule import router as schedule_router
from .db.database import init_db


# Create FastAPI app
app = FastAPI(
    title="Risk-Aware Task Scheduler",
    description="""
    Neuro-Symbolic Task Scheduling API using GraphPlan and Random Forest ML.
    
    ## Features
    - Upload tasks via CSV
    - ML-powered duration prediction
    - GraphPlan-based wave scheduling
    - Risk analysis and visualization
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    "https://plan-scheduler.vercel.app",  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router)
app.include_router(schedule_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Risk-Aware Task Scheduler API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    # Create ml-data directories if they don't exist
    os.makedirs("ml-data/raw", exist_ok=True)
    os.makedirs("ml-data/models", exist_ok=True)
    
    # Initialize database tables
    init_db()
    print("📦 Database initialized")
    
    print("🚀 Risk-Aware Task Scheduler API started")
    print("📚 API docs available at: http://localhost:8000/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
