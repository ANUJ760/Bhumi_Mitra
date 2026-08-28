from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile
from minio import Minio
from app.core.config import settings
from app.modules.documents.models import Document
from uuid import UUID
import uuid

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False
)

async def upload_document(db: AsyncSession, file: UploadFile, related_entity_type: str, related_entity_id: UUID, doc_type: str, user):
    if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
        minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
    
    file_name = f"{uuid.uuid4()}-{file.filename}"
    minio_client.put_object(
        settings.MINIO_BUCKET_NAME,
        file_name,
        file.file,
        length=-1,
        part_size=10*1024*1024
    )
    file_url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/{file_name}"

    doc = Document(
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        doc_type=doc_type,
        file_url=file_url,
        uploaded_by=user.id
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

async def list_documents(db: AsyncSession, related_entity_id: UUID):
    result = await db.execute(select(Document).where(Document.related_entity_id == related_entity_id))
    return result.scalars().all()
