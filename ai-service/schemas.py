from pydantic import BaseModel
from typing import Optional


class GenerateRequest(BaseModel):
    destination: str
    duration_days: int
    budget_level: str = "moderate"
    interests: str = ""


class ActivitySchema(BaseModel):
    sort_order: int
    time: str
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None


class DaySchema(BaseModel):
    day_number: int
    summary: str
    activities: list[ActivitySchema]


class ItineraryResponse(BaseModel):
    title: str
    cover_image_url: Optional[str] = None
    days: list[DaySchema]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    destination: str
    duration_days: int
    budget_level: str = "moderate"
    interests: Optional[str] = ""
    activities_summary: Optional[str] = ""
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []
