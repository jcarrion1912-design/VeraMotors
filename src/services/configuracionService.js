const API_URL = "http://127.0.0.1:8000/api/configuracion";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en configuración.");
    }
    return data;
};

export const obtenerCorrelativosActuales = async () => {
    const res = await fetch(`${API_URL}/correlativos`);
    return procesarRespuesta(res);
};

export const actualizarCorrelativo = async (tipoDocumento, nuevoCorrelativo) => {
    const res = await fetch(`${API_URL}/correlativos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tipo_documento: tipoDocumento,
            siguiente_correlativo: nuevoCorrelativo
        })
    });
    return procesarRespuesta(res);
};

export const obtenerConfiguracionSUNAT = async () => {
    const res = await fetch(`${API_URL}/sunat`);
    return procesarRespuesta(res);
};
