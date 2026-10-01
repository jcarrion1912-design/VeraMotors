const API_URL = "http://127.0.0.1:8000/api/diagnosticos";

const procesarRespuesta = async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || `Error HTTP ${response.status}.`);
    return data;
};

export const obtenerDiagnosticosODS = async (odsId) => {
    return procesarRespuesta(await fetch(`${API_URL}/ods/${odsId}`));
};

export const crearDiagnosticoODS = async (odsId, datos) => {
    return procesarRespuesta(await fetch(`${API_URL}/${odsId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
    }));
};
