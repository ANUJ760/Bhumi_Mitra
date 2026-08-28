from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile
from app.core.config import settings
from app.modules.documents.models import Document
from uuid import UUID
import uuid
import os

UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def upload_document(db: AsyncSession, file: UploadFile, related_entity_type: str, related_entity_id: UUID, doc_type: str, user):
    file_name = f"{uuid.uuid4()}_{file.filename}"
    file_url = f"/api/v1/documents/files/{file_name}"

    # Try MinIO first if reachable
    try:
        from minio import Minio
        minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False
        )
        if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
            minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
        minio_client.put_object(
            settings.MINIO_BUCKET_NAME,
            file_name,
            file.file,
            length=-1,
            part_size=10 * 1024 * 1024
        )
        file_url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/{file_name}"
    except Exception:
        # Fallback to local storage
        local_path = os.path.join(UPLOAD_DIR, file_name)
        content = await file.read()
        with open(local_path, "wb") as f:
            f.write(content)
        file_url = f"http://localhost:8000/uploaded_documents/{file_name}"

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
    result = await db.execute(
        select(Document).where(Document.related_entity_id == related_entity_id).order_by(Document.uploaded_at.desc())
    )
    return result.scalars().all()
