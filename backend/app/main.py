from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, listings, ml, contacts, websockets, wanted, admin

app = FastAPI(
    title="CampusSwap API",
    version="1.0.0",
    description="CampusSwap Backend - P2P Student Exchange Platform. Privacy-first, discovery-only marketplace exclusively for verified college students."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(ml.router)
app.include_router(contacts.router)
app.include_router(websockets.router)
app.include_router(wanted.router)
app.include_router(admin.router)

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
