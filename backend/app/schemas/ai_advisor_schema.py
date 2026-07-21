"""
WealthWise AI - AI Advisor Schema Definitions
"""

from __future__ import annotations

from typing import Any, List
from pydantic import BaseModel, Field


class AIAdvisorQueryRequest(BaseModel):
    question: str = Field(..., description="The question or prompt to run through the advisor")


class AIAdvisorAdviceResponse(BaseModel):
    financial_summary: str = Field(..., description="Markdown summarizing user's current situation")
    current_strengths: List[str] = Field(default_factory=list, description="Extracted positive items")
    potential_risks: List[str] = Field(default_factory=list, description="Extracted vulnerabilities")
    investment_insights: str = Field(..., description="Markdown detail of suggested allocation reasons")
    recommended_next_steps: List[str] = Field(default_factory=list, description="Extracted actions")
    long_term_opportunities: str = Field(..., description="Markdown detailing long-term horizons")
    important_considerations: str = Field(..., description="Regulatory or standard advice disclaimers")
