const API_URL =
    "http://127.0.0.1:8000/api";


const procesarRespuesta =
    async (response) => {

        const data =
            await response
                .json()
                .catch(() => null);

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                `Error HTTP ${response.status}.`
            );
        }

        return data;
    };


export const obtenerCuentasPorCobrar =
    async () => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/cuentas-por-cobrar`
            )
        );
    };


export const obtenerCuentaPorFactura =
    async (facturaId) => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/cuentas-por-cobrar/factura/${facturaId}`
            )
        );
    };


export const obtenerMetodosPago =
    async () => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/pagos/metodos`
            )
        );
    };


export const registrarPago =
    async (datos) => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/pagos`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            )
        );
    };


export const obtenerCajaActual =
    async () => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/caja`
            )
        );
    };


export const obtenerCierresCaja =
    async () => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/cierre-caja`
            )
        );
    };


export const abrirCaja =
    async (datos) => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/caja/apertura`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            )
        );
    };


export const cerrarCaja =
    async (datos) => {

        return procesarRespuesta(
            await fetch(
                `${API_URL}/caja/cierre`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            )
        );
    };