const API_URL = "http://127.0.0.1:8000/api/inventario";

const procesarRespuesta = async (res) => {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(
            data?.detail ||
            `Error HTTP ${res.status}.`
        );
    }

    return data;
};


export const obtenerInventario = async ({
    tipo = null,
    categoriaId = null
} = {}) => {

    const params = new URLSearchParams();

    if (tipo && tipo !== "Todos") {
        params.append("tipo", tipo);
    }

    if (categoriaId) {
        params.append(
            "categoria_id",
            String(categoriaId)
        );
    }

    const query = params.toString();

    const url = query
        ? `${API_URL}?${query}`
        : API_URL;

    const res = await fetch(url);

    return procesarRespuesta(res);
};


export const obtenerItem = async (itemId) => {

    const res = await fetch(
        `${API_URL}/${itemId}`
    );

    return procesarRespuesta(res);
};


export const obtenerCategoriasInventario = async () => {

    const res = await fetch(
        `${API_URL}/categorias`
    );

    return procesarRespuesta(res);
};


export const crearItem = async (datos) => {

    const res = await fetch(
        API_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos)
        }
    );

    return procesarRespuesta(res);
};


export const actualizarItem = async (
    itemId,
    datos
) => {

    const res = await fetch(
        `${API_URL}/${itemId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos)
        }
    );

    return procesarRespuesta(res);
};


export const desactivarItem = async (
    itemId
) => {

    const res = await fetch(
        `${API_URL}/${itemId}`,
        {
            method: "DELETE",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    return procesarRespuesta(res);
};