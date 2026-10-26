from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from backend.app.models.user import User, Conversation, Message, RefreshSession
from backend.app.schemas.auth import UserCreate, UserLogin, TokenResponse, GoogleAuthVerify
from backend.app.schemas.conversation import ConversationResponse
from backend.app.schemas.voice import VoiceTurnResponse
from backend.app.services.ai_services import STTService, LLMService, TTSService
import hashlib
from datetime import datetime, timezone

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "services": {
            "api": "online",
            "openai_configured": bool(settings.OPENAI_API_KEY)
        }
    }

@app.post(f"{settings.API_V1_STR}/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        is_active=True
    )
    db.add(user)
    await db.flush()
    
    access_token = create_access_token(user.id)
    raw_refresh, token_hash, expire = create_refresh_token(user.id)
    
    session = RefreshSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expire
    )
    db.add(session)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "authProvider": "local",
            "created_at": user.created_at.isoformat()
        }
    }

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalars().first()
    if not user or not user.password_hash or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    access_token = create_access_token(user.id)
    raw_refresh, token_hash, expire = create_refresh_token(user.id)
    
    session = RefreshSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expire
    )
    db.add(session)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "authProvider": "google" if user.google_subject else "local",
            "created_at": user.created_at.isoformat()
        }
    }

@app.post(f"{settings.API_V1_STR}/voice/turn", response_model=VoiceTurnResponse)
async def voice_turn(
    audio: Optional[UploadFile] = File(None),
    text_fallback: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
    voice: Optional[str] = Form("alloy"),
    db: AsyncSession = Depends(get_db)
):
    transcription = text_fallback or ""
    if audio:
        content = await audio.read()
        if content:
            transcription = await STTService.transcribe(content, audio.filename or "audio.webm")
    
    if not transcription.strip():
        raise HTTPException(status_code=400, detail="No speech transcribed.")
    
    response_text = await LLMService.generate_response(transcription)
    audio_url = await TTSService.synthesize(response_text, voice or "alloy")
    
    return {
        "conversation_id": conversation_id or "temp_session",
        "transcription": transcription,
        "response": response_text,
        "audio_data_url": audio_url
    }
