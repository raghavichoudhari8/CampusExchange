from app.main import app

# Top-level ASGI entrypoint for Vercel and local uvicorn execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
