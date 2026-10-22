from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, listings, ml, contacts, wanted, admin, cron

app = FastAPI(
    title="CampusSwap API",
    version="1.0.0",
    description="CampusSwap Backend - P2P Student Exchange Platform. Privacy-first, discovery-only marketplace exclusively for verified college students."
)

cors_origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, (list, tuple)) else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(ml.router)
app.include_router(contacts.router)
app.include_router(wanted.router)
app.include_router(admin.router)
app.include_router(cron.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "campusswap-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to CampusSwap API. Exclusively for verified college students.",
        "documentation": "/docs"
    }
