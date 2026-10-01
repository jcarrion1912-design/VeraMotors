const API_URL = "http://127.0.0.1:8000/api/reportes";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en reportes.");
    }
    return data;
};

export const obtenerDashboardMetricas = async () => {
    const res = await fetch(`${API_URL}/dashboard`);
    return procesarRespuesta(res);
};

export const obtenerVentasPorPeriodo = async (fechaInicio, fechaFin) => {
    const params = new URLSearchParams();
    params.set("fecha_inicio", `${fechaInicio}T00:00:00`);
    params.set("fecha_fin", `${fechaFin}T23:59:59`);
    const res = await fetch(`${API_URL}/ventasPeriodo?${params.toString()}`);
    return procesarRespuesta(res);
};

export const obtenerRentabilidad = async () => {
    const res = await fetch(`${API_URL}/rentabilidad`);
    return procesarRespuesta(res);
};

export const obtenerInventarioResumen = async () => {
    const res = await fetch(`${API_URL}/inventario-resumen`);
    return procesarRespuesta(res);
};

export const obtenerAsistenciaResumen = async () => {
    const res = await fetch(`${API_URL}/asistencia-resumen`);
    return procesarRespuesta(res);
};

export const obtenerTecnicosDesempenio = async () => {
    const res = await fetch(`${API_URL}/tecnicos-desempenio`);
    return procesarRespuesta(res);
};
