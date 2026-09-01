const API_URL = "http://127.0.0.1:8000/api/usuarios";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error al obtener usuarios.");
    }
    return data;
};

export const obtenerUsuarios = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};
