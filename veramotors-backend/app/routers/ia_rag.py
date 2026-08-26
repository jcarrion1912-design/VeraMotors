from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_ia_rag():
    return {"status": "ok", "module": "ia_rag"}