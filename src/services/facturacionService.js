const API_URL = "http://127.0.0.1:8000/api/facturacion";
const API_NOTAS_CREDITO_URL = "http://127.0.0.1:8000/api/notas-credito";
const API_NOTAS_DEBITO_URL = "http://127.0.0.1:8000/api/notas-debito";

const procesarRespuesta = async (res) => {
    const data = await res.json();

    if (!res.ok) {
        const mensaje =
            typeof data.detail === "string"
                ? data.detail
                : data.detail?.mensaje ||
                data.detail?.error ||
                "Error en facturación.";

        throw new Error(mensaje);
    }

    return data;
};

/* =========================================================
   FACTURAS / BOLETAS
========================================================= */

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
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });

    return procesarRespuesta(res);
};

export const actualizarFactura = async (facturaId, datos) => {
    const res = await fetch(`${API_URL}/${facturaId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });

    return procesarRespuesta(res);
};

export const anularFactura = async (facturaId) => {
    return actualizarFactura(facturaId, {
        estado_pago: "Anulado"
    });
};

/* =========================================================
   NOTAS DE CRÉDITO
========================================================= */

export const obtenerNotasCredito = async () => {
    const res = await fetch(API_NOTAS_CREDITO_URL);
    return procesarRespuesta(res);
};

export const obtenerNotaCredito = async (notaCreditoId) => {
    const res = await fetch(
        `${API_NOTAS_CREDITO_URL}/${notaCreditoId}`
    );

    return procesarRespuesta(res);
};

export const crearNotaCredito = async (datos) => {
    const res = await fetch(API_NOTAS_CREDITO_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });

    return procesarRespuesta(res);
};

/* =========================================================
   NOTAS DE DÉBITO
========================================================= */

export const obtenerNotasDebito = async () => {
    const res = await fetch(API_NOTAS_DEBITO_URL);
    return procesarRespuesta(res);
};

export const obtenerNotaDebito = async (notaDebitoId) => {
    const res = await fetch(
        `${API_NOTAS_DEBITO_URL}/${notaDebitoId}`
    );

    return procesarRespuesta(res);
};

export const crearNotaDebito = async (datos) => {
    const res = await fetch(API_NOTAS_DEBITO_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });

    return procesarRespuesta(res);
};