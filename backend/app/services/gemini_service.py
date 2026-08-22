"""
services/gemini_service.py
───────────────────────────────────────────────────────────────────────────────
Gemini AI generation layer.

Responsibility:
  1. Retrieve all relevant data via retrieval_service (RAG fetch step)
  2. Build a structured context string via context_builder
  3. Combine with the system prompt from prompts.py
  4. Call the Gemini API with the full multi-turn conversation history
  5. Return the assistant reply string

This module ONLY handles AI generation.
All data fetching is delegated to retrieval_service + repositories.
"""

import logging
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.config    import settings
from app.models.chat import ConversationTurn
from app.prompts   import SYSTEM_PROMPT
from app.services.retrieval_service import retrieve_all_context
from app.services.context_builder   import build_context_string

logger = logging.getLogger(__name__)


# ── Configure Gemini SDK once at import time ───────────────────────────────────
def _init_gemini() -> None:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Add it to backend/.env\n"
            "Get a free key at: https://aistudio.google.com/app/apikey"
        )
    genai.configure(api_key=settings.GEMINI_API_KEY)


_init_gemini()


_SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT:        HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH:       HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

_GEN_CONFIG = genai.GenerationConfig(
    max_output_tokens=settings.MAX_OUTPUT_TOKENS,
    temperature=settings.TEMPERATURE,
)


async def get_ai_reply(
    user_message: str,
    conversation: list[ConversationTurn],
    parent_id:    Optional[str] = None,
    child_id:     Optional[str] = None,
) -> str:
    """
    Full RAG-powered AI response pipeline:

      1. Retrieve context from all repositories (parallel)
      2. Build structured context string
      3. Combine with system prompt
      4. Send to Gemini with conversation history
      5. Return text reply

    Args:
        user_message:  Latest user message.
        conversation:  Prior turns [{role, content}, ...].
        parent_id:     Optional — used for personalised context retrieval.
        child_id:      Optional — used for personalised context retrieval.

    Returns:
        str — AI-generated reply (Markdown).

    Raises:
        RuntimeError — on API failure or safety block.
    """
    # ── Step 1: Retrieve all relevant data (RAG fetch) ────────
    ctx = await retrieve_all_context(parent_id=parent_id, child_id=child_id)

    # ── Step 2: Build context string ──────────────────────────
    context_block = build_context_string(ctx)

    # ── Step 3: Combine system prompt + context ───────────────
    full_system_instruction = SYSTEM_PROMPT
    if context_block:
        full_system_instruction += f"\n\n{context_block}"

    # ── Step 4: Initialise Gemini model ───────────────────────
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=full_system_instruction,
        safety_settings=_SAFETY_SETTINGS,
        generation_config=_GEN_CONFIG,
    )

    # Convert history to Gemini format (user / model roles)
    history = [
        {"role": "model" if t.role in ("model", "assistant") else "user", "parts": [t.content]}
        for t in conversation
    ]

    chat = model.start_chat(history=history)

    # ── Step 5: Call Gemini API ───────────────────────────────
    try:
        response = chat.send_message(user_message)
    except Exception as exc:
        logger.error("Gemini API error: %s", exc, exc_info=True)
        raise RuntimeError(f"Gemini API error: {exc}") from exc

    if not response.candidates:
        raise RuntimeError("Gemini returned no candidates — content may have been blocked.")

    candidate = response.candidates[0]
    finish_reason = getattr(candidate, "finish_reason", None)
    if finish_reason and getattr(finish_reason, "name", None) == "SAFETY":
        raise RuntimeError(
            "Response blocked by Gemini safety filters. Please rephrase your question."
        )

    return response.text.strip()
