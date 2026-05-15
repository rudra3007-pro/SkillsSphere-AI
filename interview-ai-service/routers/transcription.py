import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.whisper_service import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Accept an audio file and return the transcribed text.
    Supports webm, wav, mp3, ogg, and m4a formats.
    """
    allowed_types = [
        "audio/webm",
        "audio/wav",
        "audio/x-wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/ogg",
        "audio/m4a",
        "audio/mp4",
        "application/octet-stream",  # fallback for unknown types
    ]

    if audio.content_type and audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {audio.content_type}. Supported: webm, wav, mp3, ogg, m4a",
        )

    # Save uploaded audio to a temp file for faster-whisper to process
    suffix = os.path.splitext(audio.filename)[1] if audio.filename else ".webm"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        transcript = transcribe_audio(tmp_path)

        return {"transcript": transcript}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}",
        )
    finally:
        # Clean up temp file
        if "tmp_path" in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
