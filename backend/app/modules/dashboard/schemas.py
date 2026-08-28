from pydantic import BaseModel
from typing import Dict

class DashboardSummary(BaseModel):
    total_projects: int
    projects_by_status: Dict[str, int]
    total_parcels: int
    parcels_by_status: Dict[str, int]
