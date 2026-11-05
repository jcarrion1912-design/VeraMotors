const API_URL = "/api/cotizaciones";

const procesarRespuesta = async (res) => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const mensaje =
            typeof data.detail === "string"
                ? data.detail
                : data.detail?.mensaje ||
                  data.detail?.error ||
                  `Error ${res.status} en cotizaciones.`;

        throw new Error(mensaje);
    }

    return data;
};

export const obtenerCotizaciones = async (clienteId = null) => {
    const url = clienteId ? `${API_URL}?cliente_id=${clienteId}` : API_URL;
    const res = await fetch(url, { credentials: "include" });
    return procesarRespuesta(res);
};

export const obtenerCotizacion = async (cotizacionId) => {
    const res = await fetch(`${API_URL}/${cotizacionId}`, { credentials: "include" });
    return procesarRespuesta(res);
};

export const crearCotizacion = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarCotizacion = async (cotizacionId, datos) => {
    const res = await fetch(`${API_URL}/${cotizacionId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const aprobarCotizacion = async (cotizacionId, { usuario_id, motivo = "" }) => {
    const res = await fetch(`${API_URL}/${cotizacionId}/aprobar`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario_id,
            motivo: motivo || "Aprobada por el usuario"
        })
    });
    return procesarRespuesta(res);
};

export const rechazarCotizacion = async (cotizacionId, { usuario_id, motivo = "" }) => {
    const res = await fetch(`${API_URL}/${cotizacionId}/rechazar`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario_id,
            motivo: motivo || "No cumple requisitos para continuar con la venta."
        })
    });
    return procesarRespuesta(res);
};
