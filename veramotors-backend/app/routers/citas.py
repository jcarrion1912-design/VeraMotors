from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_citas():
    return {"status": "ok", "module": "citas"}