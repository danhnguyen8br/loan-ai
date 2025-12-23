"""
AI Comparison Router

Provides endpoints for AI-powered loan comparison and Q&A.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.schemas.ai_comparison import (
    AIComparisonRequest,
    AIComparisonResponse,
    FollowupQuestionRequest,
    FollowupQuestionResponse,
)
from app.services.recommendations import get_recommendation
from app.services.ai_comparison import (
    generate_comparison_summary,
    answer_followup_question,
    get_suggested_questions,
)
from app.schemas import recommendations as rec_schemas

router = APIRouter(prefix="/ai", tags=["AI Comparison"])

# Track follow-up question counts per session (in production, use Redis/DB)
followup_counts: dict[str, int] = {}
MAX_FOLLOWUPS = 3


@router.post("/compare", response_model=AIComparisonResponse)
def get_ai_comparison(
    request: AIComparisonRequest,
    db: Session = Depends(get_db),
):
    """
    Generate an AI-powered summary comparing loan products.
    """
    # Parse and validate UUID
    try:
        rec_uuid = UUID(request.recommendation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID format")
    
    # Get recommendation
    recommendation = get_recommendation(db, rec_uuid)
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    # Generate comparison
    result = generate_comparison_summary(
        recommendations=recommendation.top,
        application_snapshot=recommendation.application_snapshot,
    )
    
    # Get suggested questions
    suggested = get_suggested_questions(recommendation.top)
    
    return AIComparisonResponse(
        summary=result.get("summary", ""),
        key_insights=result.get("key_insights", []),
        recommendation=result.get("recommendation", ""),
        best_for_cost=result.get("best_for_cost"),
        best_for_stability=result.get("best_for_stability"),
        best_for_approval=result.get("best_for_approval"),
        suggested_questions=suggested,
        tokens_used=result.get("tokens_used", 0),
        error=result.get("error"),
    )


@router.post("/followup", response_model=FollowupQuestionResponse)
def ask_followup_question(
    request: FollowupQuestionRequest,
    db: Session = Depends(get_db),
):
    """
    Ask a follow-up question about the loan recommendations.
    Limited to 3 questions per recommendation session.
    """
    rec_id = request.recommendation_id
    
    # Check follow-up count
    current_count = followup_counts.get(rec_id, 0)
    if current_count >= MAX_FOLLOWUPS:
        return FollowupQuestionResponse(
            answer="Bạn đã sử dụng hết 3 câu hỏi theo dõi. Vui lòng liên hệ với ngân hàng để được tư vấn thêm.",
            questions_remaining=0,
            error="MAX_FOLLOWUPS_REACHED"
        )
    
    # Parse and validate UUID
    try:
        rec_uuid = UUID(rec_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID format")
    
    # Get recommendation
    recommendation = get_recommendation(db, rec_uuid)
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    # Convert conversation history
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.conversation_history
    ]
    
    # Get answer
    result = answer_followup_question(
        question=request.question,
        recommendations=recommendation.top,
        conversation_history=history,
        application_snapshot=recommendation.application_snapshot,
    )
    
    # Increment counter
    followup_counts[rec_id] = current_count + 1
    questions_remaining = MAX_FOLLOWUPS - followup_counts[rec_id]
    
    return FollowupQuestionResponse(
        answer=result.get("answer", ""),
        tokens_used=result.get("tokens_used", 0),
        questions_remaining=questions_remaining,
        error=result.get("error"),
    )


@router.get("/remaining/{recommendation_id}")
def get_remaining_questions(recommendation_id: str):
    """
    Get the number of remaining follow-up questions for a recommendation.
    """
    current_count = followup_counts.get(recommendation_id, 0)
    return {
        "recommendation_id": recommendation_id,
        "questions_used": current_count,
        "questions_remaining": MAX_FOLLOWUPS - current_count,
        "max_questions": MAX_FOLLOWUPS,
    }


@router.post("/reset/{recommendation_id}")
def reset_followup_count(recommendation_id: str):
    """
    Reset the follow-up question count for a recommendation (admin/testing).
    """
    if recommendation_id in followup_counts:
        del followup_counts[recommendation_id]
    return {
        "recommendation_id": recommendation_id,
        "questions_remaining": MAX_FOLLOWUPS,
        "message": "Follow-up count reset successfully"
    }

