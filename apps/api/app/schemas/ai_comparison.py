"""
AI Comparison Schemas
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class AIComparisonRequest(BaseModel):
    """Request for AI comparison summary."""
    recommendation_id: str


class AIComparisonResponse(BaseModel):
    """Response with AI-generated comparison."""
    summary: str
    key_insights: List[str] = []
    recommendation: str = ""
    best_for_cost: Optional[str] = None
    best_for_stability: Optional[str] = None
    best_for_approval: Optional[str] = None
    suggested_questions: List[str] = []
    tokens_used: int = 0
    error: Optional[str] = None


class ConversationMessage(BaseModel):
    """A single message in the conversation."""
    role: str  # "user" or "assistant"
    content: str


class FollowupQuestionRequest(BaseModel):
    """Request for a follow-up question."""
    recommendation_id: str
    question: str
    conversation_history: List[ConversationMessage] = []


class FollowupQuestionResponse(BaseModel):
    """Response to a follow-up question."""
    answer: str
    tokens_used: int = 0
    questions_remaining: int = 0
    error: Optional[str] = None

