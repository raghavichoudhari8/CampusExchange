from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, listings, ml, contacts, wanted, admin, cron

app = FastAPI(
    title="CampusSwap API",
    version="1.0.0",
    description="CampusSwap Backend - P2P Student Exchange Platform. Privacy-first, discovery-only marketplace exclusively for verified college students.",
    redirect_slashes=False
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

@app.middleware("http")
async def vercel_path_normalizer(request: Request, call_next):
    """
    Normalizes path when requests are forwarded by Vercel serverless rewrites.
    Restores the original matched path if rewritten to entrypoint.
    """
    matched_path = request.headers.get("x-matched-path")
    if matched_path and request.scope.get("path") in ("/api/index.py", "/api", "/api/index", "/main.py"):
        request.scope["path"] = matched_path
    elif request.scope.get("path") in ("/api/index.py", "/main.py"):
        request.scope["path"] = "/"
    elif request.scope.get("path", "").startswith("/api/index.py/"):
        request.scope["path"] = request.scope["path"][len("/api/index.py"):]
    elif request.scope.get("path", "").startswith("/main.py/"):
        request.scope["path"] = request.scope["path"][len("/main.py"):]

    response = await call_next(request)
    return response

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(ml.router)
app.include_router(contacts.router)
app.include_router(wanted.router)
app.include_router(admin.router)
app.include_router(cron.router)

@app.get("/health")
@app.get("/health/")
def health_check():
    return {
        "status": "healthy",
        "service": "campusswap-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
@app.get("/api/index.py", include_in_schema=False)
@app.get("/main.py", include_in_schema=False)
def root():
    return {
        "message": "Welcome to CampusSwap API. Exclusively for verified college students.",
        "documentation": "/docs"
    }
