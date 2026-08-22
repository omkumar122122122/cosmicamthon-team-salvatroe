"""
routes/chat.py — POST /api/chat endpoint
"""
import logging
from fastapi import APIRouter, HTTPException, status

from app.models.chat import ChatRequest, ChatResponse
from app.services.gemini_service import get_ai_reply

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse, summary="Send a message to YourSathi AI")
async def chat(request: ChatRequest) -> ChatResponse:
    """
    POST /api/chat

    Body:
      message (str)        — user's latest message
      conversation (list)  — prior turns for multi-turn context
      parentId (str|None)  — optional, enables personalised context
      childId  (str|None)  — optional, enables personalised context
    """
    logger.info(
        "Chat request — parentId=%s childId=%s turns=%d",
        request.parentId, request.childId, len(request.conversation),
    )

    try:
        reply = await get_ai_reply(
            user_message=request.message,
            conversation=request.conversation,
            parent_id=request.parentId,
            child_id=request.childId,
        )
    except RuntimeError as exc:
        logger.warning("AI reply error: %s", exc)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected error: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error. Please try again.")

    return ChatResponse(reply=reply)
