const API_URL = "http://127.0.0.1:8000/api/citas";


const procesarRespuesta = async (res) => {

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data.detail ||
            "Error en la solicitud de citas."
        );
    }

    return data;
};


export const obtenerCitas = async ({
    clienteId = null,
    estado = null
} = {}) => {

    const params = new URLSearchParams();

    if (clienteId) {
        params.append(
            "cliente_id",
            clienteId
        );
    }

    if (estado && estado !== "Todos") {
        params.append(
            "estado",
            estado
        );
    }

    const query = params.toString();

    const url = query
        ? `${API_URL}?${query}`
        : API_URL;

    const res = await fetch(url);

    return procesarRespuesta(res);
};


export const obtenerCita = async (citaId) => {

    const res = await fetch(
        `${API_URL}/${citaId}`
    );

    return procesarRespuesta(res);
};


export const crearCita = async (datos) => {

    const res = await fetch(
        API_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)
        }
    );

    return procesarRespuesta(res);
};


export const actualizarCita = async (
    citaId,
    datos
) => {

    const res = await fetch(
        `${API_URL}/${citaId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)
        }
    );

    return procesarRespuesta(res);
};