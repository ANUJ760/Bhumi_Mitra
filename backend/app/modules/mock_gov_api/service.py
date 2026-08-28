from app.modules.mock_gov_api.fixtures import MOCK_LAND_RECORDS

async def lookup_land_record(ulpin: str):
    for rec in MOCK_LAND_RECORDS:
        if rec["ulpin"] == ulpin:
            return rec
    return None
