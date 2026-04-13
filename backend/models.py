from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaperResponse(BaseModel):
    id: int
    title: Optional[str]
    publication: Optional[str] 
    authors: Optional[str]
    year: Optional[str]
    model_used: Optional[str]
    accuracy: Optional[str]
    dataset: Optional[str]
    filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PapersFilter(BaseModel):
    year: Optional[str] = None
    model_used: Optional[str] = None
    dataset: Optional[str] = None