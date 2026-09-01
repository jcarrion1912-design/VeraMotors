const API_URL = "http://127.0.0.1:8000/api/clientes";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en clientes.");
    }
    return data;
};

export const obtenerClientes = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const obtenerCliente = async (clienteId) => {
    const res = await fetch(`${API_URL}/${clienteId}`);
    return procesarRespuesta(res);
};

export const crearCliente = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarCliente = async (clienteId, datos) => {
    const res = await fetch(`${API_URL}/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const eliminarCliente = async (clienteId) => {
    const res = await fetch(`${API_URL}/${clienteId}`, {
        method: "DELETE"
    });
    return procesarRespuesta(res);
};
