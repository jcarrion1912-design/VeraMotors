const API_URL = "http://127.0.0.1:8000/api/bancos";

const procesarRespuesta = async (res) => {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || "Error en bancos.");
    }
    return data;
};

export const obtenerCuentasBancarias = async () => {
    const res = await fetch(`${API_URL}/cuentas`);
    return procesarRespuesta(res);
};

export const crearCuentaBancaria = async (datos) => {
    const res = await fetch(`${API_URL}/cuentas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const obtenerMovimientosBancarios = async () => {
    const res = await fetch(`${API_URL}/movimientos`);
    return procesarRespuesta(res);
};

export const registrarMovimiento = async (datos) => {
    const res = await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};

export const actualizarMovimiento = async (movimientoId, datos) => {
    const res = await fetch(`${API_URL}/movimientos/${movimientoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return procesarRespuesta(res);
};
