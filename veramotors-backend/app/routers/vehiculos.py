from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_vehiculos():
    return {"status": "ok", "module": "vehiculos"}