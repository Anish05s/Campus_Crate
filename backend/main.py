from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, listings, chat, uploads, users
import uvicorn

import os

# Create DB tables (In production, use Alembic)
if engine:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusCrate API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(chat.router)
app.include_router(uploads.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusCrate API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
