const API_URL = "http://127.0.0.1:8000/api/facturacion";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en facturación.");
    }
    return data;
};

export const obtenerFacturas = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const obtenerFactura = async (facturaId) => {
    const res = await fetch(`${API_URL}/${facturaId}`);
    return procesarRespuesta(res);
};

export const crearFactura = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarFactura = async (facturaId, datos) => {
    const res = await fetch(`${API_URL}/${facturaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const anularFactura = async (facturaId) => {
    return actualizarFactura(facturaId, { estado_pago: "Anulado" });
};
