from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_ods():
    return {"status": "ok", "module": "ods"}