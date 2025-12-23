"""
AI-powered Loan Comparison Service

Uses OpenAI to provide natural language summaries and comparisons
of loan products, with support for follow-up questions.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
import json

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas import recommendations as rec_schemas


# System prompt for the AI assistant
SYSTEM_PROMPT = """Bạn là một chuyên gia tư vấn tài chính chuyên về các sản phẩm vay thế chấp tại Việt Nam. 
Nhiệm vụ của bạn là giúp người dùng hiểu và so sánh các gói vay một cách dễ hiểu.

Quy tắc:
1. Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu
2. Sử dụng số liệu cụ thể khi có thể (triệu/tỷ VND, phần trăm)
3. Nêu rõ ưu điểm và nhược điểm của từng sản phẩm
4. Giải thích các thuật ngữ chuyên môn khi cần thiết
5. Đưa ra khuyến nghị dựa trên hồ sơ người dùng
6. Luôn nhắc nhở người dùng xác nhận thông tin với ngân hàng trước khi quyết định

Các khái niệm quan trọng:
- APR (Annual Percentage Rate): Lãi suất thực tế quy năm, bao gồm cả phí
- Ân hạn nợ gốc: Thời gian chỉ trả lãi, chưa trả gốc
- Lãi suất cố định: Lãi suất không đổi trong kỳ ưu đãi
- Lãi suất thả nổi: Lãi suất biến động theo lãi tham chiếu + biên độ
- Stress test: Kiểm tra khả năng chi trả khi lãi suất tăng"""


def _format_recommendations_for_prompt(
    recommendations: List[rec_schemas.ProductRecommendation],
    application_snapshot: Optional[Dict[str, Any]] = None,
) -> str:
    """Format recommendation data into a readable string for the AI."""
    
    output = []
    
    # Application context
    if application_snapshot:
        output.append("=== THÔNG TIN KHOẢN VAY ===")
        output.append(f"- Số tiền vay: {application_snapshot.get('loan_amount', 0) / 1e9:.2f} tỷ VND")
        output.append(f"- Thời hạn vay: {application_snapshot.get('tenor_months', 0)} tháng")
        output.append(f"- Mục đích: {application_snapshot.get('purpose', 'N/A')}")
        if application_snapshot.get('planned_hold_months'):
            output.append(f"- Thời gian dự kiến giữ khoản vay: {application_snapshot['planned_hold_months']} tháng")
        output.append("")
    
    output.append("=== CÁC SẢN PHẨM ĐỀ XUẤT ===\n")
    
    for i, rec in enumerate(recommendations, 1):
        output.append(f"### {i}. {rec.product_name} ({rec.bank_name})")
        output.append(f"   Điểm phù hợp: {rec.fit_score}/100")
        output.append(f"   Xác suất duyệt: {rec.approval_bucket}")
        
        # Rate details
        if rec.rate_details:
            output.append(f"   Lãi suất cố định: {rec.rate_details.get('fixed_rate', 0)}% trong {rec.rate_details.get('fixed_months', 0)} tháng")
            output.append(f"   Lãi suất thả nổi: Lãi tham chiếu + {rec.rate_details.get('floating_margin', 0)}%")
        
        # Grace period
        if rec.grace_principal_months and rec.grace_principal_months > 0:
            output.append(f"   Ân hạn nợ gốc: {rec.grace_principal_months} tháng")
        
        # APR
        if rec.apr:
            output.append(f"   APR thực tế: {rec.apr * 100:.2f}%")
        
        # Costs
        if rec.scenarios and '+0%' in rec.scenarios:
            base = rec.scenarios['+0%']
            output.append(f"   Thanh toán tháng đầu: {base.monthly_payment_first_12m / 1e6:.1f} triệu")
            output.append(f"   Thanh toán sau kỳ cố định: {base.monthly_payment_post_promo / 1e6:.1f} triệu")
            output.append(f"   Tổng lãi: {base.total_interest / 1e9:.2f} tỷ")
            output.append(f"   Tổng chi phí (không gồm gốc): {base.total_cost / 1e9:.2f} tỷ")
        
        # Stress test
        if rec.scenarios and '+4%' in rec.scenarios:
            stress = rec.scenarios['+4%']
            output.append(f"   Thanh toán khi lãi +4%: {stress.monthly_payment_post_promo / 1e6:.1f} triệu")
        
        # Prepayment at promo end
        if rec.prepayment_at_promo_end:
            pe = rec.prepayment_at_promo_end
            output.append(f"   Chi phí tất toán sau kỳ ưu đãi: {pe.total_cost_to_exit / 1e9:.2f} tỷ (gồm phí phạt {pe.prepayment_fee / 1e6:.0f} triệu)")
        
        # Why fit
        output.append(f"   Phù hợp vì: {', '.join(rec.why_fit)}")
        
        # Risks
        if rec.risks:
            output.append(f"   Rủi ro: {', '.join(rec.risks)}")
        
        # Scores breakdown
        output.append(f"   Điểm chi tiết: Chi phí {rec.cost_score:.0f}, Ổn định {rec.stability_score:.0f}, Duyệt {rec.approval_score:.0f}, Tốc độ {rec.speed_score:.0f}, Phạt {rec.penalties_score:.0f}")
        
        output.append("")
    
    return "\n".join(output)


def generate_comparison_summary(
    recommendations: List[rec_schemas.ProductRecommendation],
    application_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate an AI-powered summary comparing loan products.
    
    Returns a structured response with summary and key insights.
    """
    if not settings.OPENAI_API_KEY:
        return {
            "summary": "Chức năng AI chưa được cấu hình. Vui lòng thiết lập OPENAI_API_KEY.",
            "key_insights": [],
            "recommendation": "",
            "error": "OPENAI_API_KEY not configured"
        }
    
    if not recommendations:
        return {
            "summary": "Không có sản phẩm nào để so sánh.",
            "key_insights": [],
            "recommendation": "",
        }
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    # Format data for prompt
    data_context = _format_recommendations_for_prompt(recommendations, application_snapshot)
    
    user_prompt = f"""Dựa trên thông tin sau, hãy:
1. Tóm tắt ngắn gọn (2-3 câu) về các gói vay được đề xuất
2. So sánh và nêu 3-4 điểm khác biệt chính giữa các sản phẩm
3. Đưa ra khuyến nghị sản phẩm phù hợp nhất và lý do

{data_context}

Trả lời theo format JSON:
{{
    "summary": "Tóm tắt ngắn gọn...",
    "key_insights": [
        "Điểm khác biệt 1...",
        "Điểm khác biệt 2...",
        "Điểm khác biệt 3..."
    ],
    "recommendation": "Khuyến nghị sản phẩm...",
    "best_for_cost": "Sản phẩm tốt nhất về chi phí và lý do ngắn",
    "best_for_stability": "Sản phẩm tốt nhất về ổn định và lý do ngắn",
    "best_for_approval": "Sản phẩm dễ duyệt nhất và lý do ngắn"
}}"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        result["tokens_used"] = response.usage.total_tokens if response.usage else 0
        return result
        
    except Exception as e:
        return {
            "summary": f"Không thể tạo tóm tắt AI: {str(e)}",
            "key_insights": [],
            "recommendation": "",
            "error": str(e)
        }


def answer_followup_question(
    question: str,
    recommendations: List[rec_schemas.ProductRecommendation],
    conversation_history: List[Dict[str, str]],
    application_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Answer a follow-up question about the loan recommendations.
    
    Args:
        question: The user's follow-up question
        recommendations: List of product recommendations
        conversation_history: Previous Q&A pairs
        application_snapshot: Application context
        
    Returns:
        Dict with answer and updated conversation
    """
    if not settings.OPENAI_API_KEY:
        return {
            "answer": "Chức năng AI chưa được cấu hình. Vui lòng thiết lập OPENAI_API_KEY.",
            "error": "OPENAI_API_KEY not configured"
        }
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    # Format data for context
    data_context = _format_recommendations_for_prompt(recommendations, application_snapshot)
    
    # Build messages with conversation history
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Đây là thông tin về các gói vay đang được so sánh:\n\n{data_context}"}
    ]
    
    # Add conversation history
    for item in conversation_history:
        if item.get("role") == "user":
            messages.append({"role": "user", "content": item["content"]})
        elif item.get("role") == "assistant":
            messages.append({"role": "assistant", "content": item["content"]})
    
    # Add current question
    messages.append({"role": "user", "content": question})
    
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )
        
        answer = response.choices[0].message.content
        
        return {
            "answer": answer,
            "tokens_used": response.usage.total_tokens if response.usage else 0,
        }
        
    except Exception as e:
        return {
            "answer": f"Không thể trả lời câu hỏi: {str(e)}",
            "error": str(e)
        }


def get_suggested_questions(
    recommendations: List[rec_schemas.ProductRecommendation],
) -> List[str]:
    """
    Generate suggested follow-up questions based on the recommendations.
    """
    suggestions = []
    
    if len(recommendations) >= 2:
        suggestions.append(f"So sánh chi tiết giữa {recommendations[0].product_name} và {recommendations[1].product_name}?")
    
    # Check for grace period
    has_grace = any(r.grace_principal_months and r.grace_principal_months > 0 for r in recommendations)
    if has_grace:
        suggestions.append("Ân hạn nợ gốc ảnh hưởng thế nào đến tổng chi phí?")
    
    # Check for prepayment scenarios
    has_prepay = any(r.prepayment_at_promo_end for r in recommendations)
    if has_prepay:
        suggestions.append("Nếu tôi muốn tất toán sớm sau 2 năm, sản phẩm nào có lợi nhất?")
    
    # General questions
    suggestions.extend([
        "Với mức lương của tôi, khoản thanh toán hàng tháng có hợp lý không?",
        "Nếu lãi suất tăng 2%, tôi có nên chọn sản phẩm có kỳ cố định dài hơn?",
        "Sản phẩm nào phù hợp nếu tôi ưu tiên tốc độ giải ngân?",
    ])
    
    return suggestions[:5]  # Return max 5 suggestions

