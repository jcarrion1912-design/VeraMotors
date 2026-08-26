from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_clientes():
    return {"status": "ok", "module": "clientes"}