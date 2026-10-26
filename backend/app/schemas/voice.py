from pydantic import BaseModel
from typing import Optional

class TranscribeRequest(BaseModel):
    audio: Optional[str] = None
    mime_type: Optional[str] = "audio/webm"

class TranscribeResponse(BaseModel):
    text: str

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"

class SynthesizeResponse(BaseModel):
    audio_data_url: str
    format: str = "audio/mp3"

class VoiceTurnResponse(BaseModel):
    conversation_id: str
    transcription: str
    response: str
    audio_data_url: Optional[str] = None
