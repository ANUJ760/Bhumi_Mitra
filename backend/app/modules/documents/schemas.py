from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    related_entity_type: str
    related_entity_id: UUID
    doc_type: str
    file_url: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
