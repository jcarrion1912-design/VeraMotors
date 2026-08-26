from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_facturacion():
    return {"status": "ok", "module": "facturacion"}