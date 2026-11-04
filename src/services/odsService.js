const API_URL = "http://127.0.0.1:8000/api/ods";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en órdenes de servicio.");
    }
    return data;
};

export const obtenerODS = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const obtenerODSPorId = async (odsId) => {
    const res = await fetch(`${API_URL}/${odsId}`);
    return procesarRespuesta(res);
};

export const crearODS = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarODS = async (odsId, datos) => {
    const res = await fetch(`${API_URL}/${odsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const cambiarEstadoODS = async (odsId, nuevoEstado) => {
    return actualizarODS(odsId, { estado_actual: nuevoEstado });
};

export const generarEnlaceAprobacion = async (odsId) => {
    const res = await fetch(`http://127.0.0.1:8000/api/aprobacion-cliente/enlace/${odsId}`, {
        method: "POST"
    });
    return procesarRespuesta(res);
};

export const eliminarODS = async (odsId) => {
    const res = await fetch(`${API_URL}/${odsId}`, {
        method: "DELETE"
    });
    return procesarRespuesta(res);
};
