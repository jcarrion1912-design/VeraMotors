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

/**
 * Solicita el PDF oficial de una guía de remisión.
 * El backend intenta obtenerlo de APISUNAT.
 * Si la guía aún no fue aceptada por SUNAT, el backend devuelve 404
 * y el mensaje de error indica el estado real del documento.
 *
 * IMPORTANTE: el PDF devuelto es un documento electrónico oficial
 * ÚNICAMENTE si el estado_sunat de la guía es "Aceptado".
 */
export const descargarPdfRemision = async (remisionId, formato = "A4") => {
    const response = await fetch(`${API_URL}/${remisionId}/pdf?formato=${encodeURIComponent(formato)}`);
    if (!response.ok) {
        // FastAPI devuelve JSON { detail: "..." } en todos los errores
        let msg = `Error HTTP ${response.status} al solicitar el PDF.`;
        try {
            const errorJson = await response.json();
            if (errorJson?.detail) msg = errorJson.detail;
        } catch {
            try { msg = (await response.text()) || msg; } catch { /* ignorar */ }
        }
        throw new Error(msg);
    }
    return response.blob();
};
