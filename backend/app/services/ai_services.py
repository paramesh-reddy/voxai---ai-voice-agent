import base64
import io
from openai import AsyncOpenAI
from backend.app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

class STTService:
    @staticmethod
    async def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
        if not openai_client:
            raise ValueError("STT service is not configured. OPENAI_API_KEY is required.")
        
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        
        transcript = await openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
        return str(transcript).strip()

class LLMService:
    @staticmethod
    async def generate_response(prompt: str, history: list[dict] = None) -> str:
        if not openai_client:
            raise ValueError("LLM service is not configured. OPENAI_API_KEY is required.")
        
        messages = [
            {
                "role": "system",
                "content": (
                    "You are VoxAI, a state-of-the-art voice conversational assistant. "
                    "Speak naturally, clearly, and concisely (1-3 sentences) suitable for speech output. "
                    "Avoid tables, markdown code formatting, or unnatural symbols."
                )
            }
        ]
        
        if history:
            for item in history[-8:]:
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        
        messages.append({"role": "user", "content": prompt})
        
        response = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content or ""

class TTSService:
    @staticmethod
    async def synthesize(text: str, voice: str = "alloy") -> str:
        if not openai_client:
            raise ValueError("TTS service is not configured. OPENAI_API_KEY is required.")
        
        clean_text = text.replace("*", "").strip()[:1000]
        response = await openai_client.audio.speech.create(
            model="tts-1",
            voice=voice or settings.OPENAI_TTS_VOICE,
            input=clean_text,
            response_format="mp3"
        )
        audio_bytes = response.content
        b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return f"data:audio/mp3;base64,{b64}"
