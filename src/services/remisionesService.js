const API_URL = "http://127.0.0.1:8000/api/remisiones";

const procesarRespuesta = async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.detail || `Error HTTP ${response.status}.`);
    }
    return data;
};

export const obtenerRemisiones = async () => {
    return procesarRespuesta(await fetch(API_URL));
};

export const obtenerVentasDisponiblesRemision = async () => {
    return procesarRespuesta(await fetch(`${API_URL}/ventas-disponibles`));
};

export const crearRemision = async (datos) => {
    return procesarRespuesta(await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
    }));
};

export const obtenerDocumentosRemision = async (remisionId) => {
    return procesarRespuesta(await fetch(`${API_URL}/${remisionId}/documentos`));
};

export const registrarDespachoRemision = async (remisionId, usuarioId) => {
    return procesarRespuesta(await fetch(`${API_URL}/${remisionId}/despacho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: Number(usuarioId) }),
    }));
};

export const actualizarEstadoRemision = async (remisionId, estado) => {
    return procesarRespuesta(await fetch(`${API_URL}/${remisionId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
    }));
};
