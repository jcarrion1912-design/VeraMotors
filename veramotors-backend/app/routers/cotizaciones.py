from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_cotizaciones():
    return {"status": "ok", "module": "cotizaciones"}