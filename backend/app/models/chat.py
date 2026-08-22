"""
models/chat.py — Pydantic request/response models for /api/chat
"""
from pydantic import BaseModel, Field
from typing import Optional


class ConversationTurn(BaseModel):
    role:    str = Field(..., description="'user' or 'model'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message:      str                    = Field(..., min_length=1, max_length=4000)
    conversation: list[ConversationTurn] = Field(default_factory=list)
    parentId:     Optional[str]          = Field(None)
    childId:      Optional[str]          = Field(None)


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI-generated reply (may contain Markdown)")
