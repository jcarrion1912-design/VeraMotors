from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_inventario():
    return {"status": "ok", "module": "inventario"}