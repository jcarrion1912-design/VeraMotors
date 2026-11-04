const API_URL = "http://127.0.0.1:8000/api/recepciones";

const procesarRespuesta = async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.detail || `Error HTTP ${res.status} en recepciones.`);
    }
    return data;
};

export const obtenerRecepciones = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const crearRecepcion = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};
