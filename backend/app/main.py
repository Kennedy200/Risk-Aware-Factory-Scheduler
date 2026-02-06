"""
FastAPI Main Application
Entry point for the Risk-Aware Task Scheduler API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Updated imports to ensure they work correctly in the deployed environment
try:
    from .api.routes.upload import router as upload_router
    from .api.routes.schedule import router as schedule_router
    from .db.database import init_db
except ImportError:
    # Fallback for different execution contexts in production
    from api.routes.upload import router as upload_router
    from api.routes.schedule import router as schedule_router
    from db.database import init_db

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

# --- CONFIGURE CORS FOR PRODUCTION ---
# We include "*" to ensure that your Vercel preview URLs don't get blocked.
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://risk-aware-factory-scheduler.vercel.app/",
    "*" # Highly recommended for the 24h deadline to prevent CORS blocking
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, prefix="/api")
app.include_router(schedule_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint for Health Check."""
    return {
        "status": "online",
        "message": "Risk-Aware Task Scheduler API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.on_event("startup")
async def startup_event():
    """Initialize system resources on startup."""
    # Ensure directories exist for ML models and data
    # Using absolute paths to avoid issues on cloud containers
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ml_raw = os.path.join(base_dir, "ml-data", "raw")
    ml_models = os.path.join(base_dir, "ml-data", "models")
    
    os.makedirs(ml_raw, exist_ok=True)
    os.makedirs(ml_models, exist_ok=True)
    
    # Initialize database tables
    try:
        init_db()
        print("📦 Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database init warning: {e}")
    
    print("🚀 Risk-Aware Task Scheduler API is now active")


if __name__ == "__main__":
    # Render provides a PORT environment variable. We must use it.
    port = int(os.environ.get("PORT", 8000))
    import uvicorn
    # In production, uvicorn needs the string import path
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)