const API_URL = "http://127.0.0.1:8000/api/asistencia";


// ======================================================
// OBTENER ASISTENCIAS
// ======================================================

export const obtenerAsistencias = async () => {

    const res = await fetch(`${API_URL}/reporte`);

    if (!res.ok) {

        let mensaje =
            "Error al obtener el reporte de asistencias";

        try {

            const errorData = await res.json();

            if (errorData.detail) {
                mensaje = errorData.detail;
            }

        } catch {
            // Mantener mensaje general
        }

        throw new Error(mensaje);
    }

    return await res.json();
};


// ======================================================
// MARCAR ENTRADA
// ======================================================

export const marcarEntrada = async (
    userId,
    fecha,
    observaciones = ""
) => {

    const res = await fetch(
        `${API_URL}/marcar-entrada`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                user_id: userId,
                fecha: fecha,
                observaciones: observaciones
            })
        }
    );

    if (!res.ok) {

        let mensaje = "Error al marcar entrada";

        try {

            const errorData = await res.json();

            if (errorData.detail) {
                mensaje = errorData.detail;
            }

        } catch {
            // Mantener mensaje general
        }

        throw new Error(mensaje);
    }

    return await res.json();
};


// ======================================================
// MARCAR SALIDA
// ======================================================

export const marcarSalida = async (
    asistenciaId,
    observaciones = ""
) => {

    const res = await fetch(
        `${API_URL}/marcar-salida`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                asistencia_id: asistenciaId,
                observaciones: observaciones
            })
        }
    );

    if (!res.ok) {

        let mensaje = "Error al marcar salida";

        try {

            const errorData = await res.json();

            if (errorData.detail) {
                mensaje = errorData.detail;
            }

        } catch {
            // Mantener mensaje general
        }

        throw new Error(mensaje);
    }

    return await res.json();
};


// ======================================================
// ACTUALIZAR ASISTENCIA
// ======================================================
// Este endpoint permite modificar:
// - Hora de entrada
// - Hora de salida
// - Estado
// - Observaciones
//
// PUT /api/asistencia/{asistencia_id}
// ======================================================

export const actualizarAsistencia = async (
    asistenciaId,
    datos
) => {

    const res = await fetch(
        `${API_URL}/${asistenciaId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)
        }
    );

    if (!res.ok) {

        let mensaje =
            "Error al actualizar la asistencia";

        try {

            const errorData = await res.json();

            if (errorData.detail) {
                mensaje = errorData.detail;
            }

        } catch {
            // Mantener mensaje general
        }

        throw new Error(mensaje);
    }

    return await res.json();
};