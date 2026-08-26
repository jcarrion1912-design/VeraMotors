from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_diagnosticos():
    return {"status": "ok", "module": "diagnosticos"}