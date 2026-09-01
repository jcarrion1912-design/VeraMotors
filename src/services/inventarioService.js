const API_URL =
    "http://127.0.0.1:8000/api/inventario";


const procesarRespuesta = async (res) => {

    const data = await res.json();

    if (!res.ok) {

        throw new Error(
            data.detail ||
            "Error en inventario."
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
        params.append(
            "tipo",
            tipo
        );
    }

    if (categoriaId) {
        params.append(
            "categoria_id",
            categoriaId
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


export const crearItem = async (datos) => {

    const res = await fetch(
        API_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)
        }
    );

    return procesarRespuesta(res);
};