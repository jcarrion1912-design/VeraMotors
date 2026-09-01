const API_URL = "http://127.0.0.1:8000/api/proveedores";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en proveedores.");
    }
    return data;
};

export const obtenerProveedores = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const obtenerProveedor = async (proveedorId) => {
    const res = await fetch(`${API_URL}/${proveedorId}`);
    return procesarRespuesta(res);
};

export const crearProveedor = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarProveedor = async (proveedorId, datos) => {
    const res = await fetch(`${API_URL}/${proveedorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const eliminarProveedor = async (proveedorId) => {
    const res = await fetch(`${API_URL}/${proveedorId}`, {
        method: "DELETE"
    });
    return procesarRespuesta(res);
};
