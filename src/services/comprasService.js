const API_URL = "http://127.0.0.1:8000/api/compras";
const API_RECEPCIONES_URL = "http://127.0.0.1:8000/api/recepciones";
const API_FACTURAS_URL = "http://127.0.0.1:8000/api/facturas-proveedor";
const API_PAGOS_URL = "http://127.0.0.1:8000/api/pagos-proveedor";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en compras.");
    }
    return data;
};

export const obtenerCompras = async () => {
    const res = await fetch(API_URL);
    return procesarRespuesta(res);
};

export const obtenerCompra = async (compraId) => {
    const res = await fetch(`${API_URL}/${compraId}`);
    return procesarRespuesta(res);
};

export const crearCompra = async (datos) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarCompra = async (compraId, datos) => {
    const res = await fetch(`${API_URL}/${compraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const obtenerDetallesCompra = async (compraId) => {
    const res = await fetch(`${API_URL}/${compraId}/detalles`);
    return procesarRespuesta(res);
};

export const obtenerRecepciones = async () => {
    const res = await fetch(API_RECEPCIONES_URL);
    return procesarRespuesta(res);
};

export const registrarRecepcion = async (datos) => {
    const res = await fetch(API_RECEPCIONES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const obtenerFacturasProveedor = async () => {
    const res = await fetch(API_FACTURAS_URL);
    return procesarRespuesta(res);
};

export const crearFacturaProveedor = async (datos) => {
    const res = await fetch(API_FACTURAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const obtenerPagosProveedor = async () => {
    const res = await fetch(API_PAGOS_URL);
    return procesarRespuesta(res);
};

export const registrarPagoProveedor = async (datos) => {
    const res = await fetch(API_PAGOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const eliminarCompra = async (compraId) => {
    const res = await fetch(`${API_URL}/${compraId}`, {
        method: "DELETE"
    });
    return procesarRespuesta(res);
};
