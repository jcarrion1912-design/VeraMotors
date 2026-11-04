
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRole } from "../../context/authContext";
import CuentasPorCobrar from "../../components/CuentasPorCobrar/CuentasPorCobrar";
import Caja from "../../components/Caja/Caja";
import {
    obtenerCajaActual,
    obtenerCuentaPorFactura,
    obtenerMetodosPago,
    registrarPago
} from "../../services/cobrosService";
import { abrirDocumentoProtegido } from "../../services/autenticacion";
import "./Facturacion.css";

const API_URL = "http://127.0.0.1:8000/api";

const SUBMENUS_FACTURACION = [
    "Facturas",
    "Notas de Crédito",
    "Notas de Débito",
    "Cuentas por Cobrar",
    "Cierre de Caja"
];

function Facturacion() {

    const { usuarioActual } = useRole();

    const location = useLocation();
    const [submodulo, setSubmodulo] = useState("Facturas");

    const [mostrarWizard, setMostrarWizard] = useState(false);
    const [pasoWizard, setPasoWizard] = useState(1);

    // =========================================================
    // DATOS
    // =========================================================

    const [facturasList, setFacturasList] = useState([]);
    const [cotizacionesList, setCotizacionesList] = useState([]);
    const [notasCreditoList, setNotasCreditoList] = useState([]);
    const [cierresCajaList, setCierresCajaList] = useState([]);

    const [clientes, setClientes] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [ordenesServicio, setOrdenesServicio] = useState([]);

    const [cargandoFacturas, setCargandoFacturas] = useState(false);
    const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false);
    const [cargandoNotasCredito, setCargandoNotasCredito] = useState(false);
    const [cargandoCierresCaja, setCargandoCierresCaja] = useState(false);

    // Pre-cargar datos si se navega desde el módulo independiente de Cotizaciones con una cotización aprobada
    useEffect(() => {
        if (location.state?.cotizacion) {
            const cot = location.state.cotizacion;
            if (cot.cliente_id) setClienteFactura(String(cot.cliente_id));
            if (cot.vehiculo_id) setVehiculoFactura(String(cot.vehiculo_id));
            if (Array.isArray(cot.detalles) && cot.detalles.length > 0) {
                setItemsFactura(cot.detalles.map((d, index) => ({
                    id: index + 1,
                    item_id: d.item_id || null,
                    descripcion: d.descripcion,
                    cantidad: Number(d.cantidad || 1),
                    precio_unitario: Number(d.precio_unitario || 0),
                    descuento: Number(d.descuento || 0)
                })));
            }
            setSubmodulo("Facturas");
            setMostrarWizard(true);
            setPasoWizard(1);
        }
    }, [location.state]);
    const [consultandoFactura, setConsultandoFactura] = useState(null);

    // =========================================================
    // WIZARD
    // =========================================================

    const [clienteFactura, setClienteFactura] = useState("");
    const [vehiculoFactura, setVehiculoFactura] = useState("");
    const [odsSeleccionada, setOdsSeleccionada] = useState("");

    const [tipoComprobante, setTipoComprobante] =
        useState("Factura Electrónica");

    const [metodoPago, setMetodoPago] = useState("");

    const [observacionesPago, setObservacionesPago] = useState("");

    const [itemsFactura, setItemsFactura] = useState([]);

    const [nuevoItemDesc, setNuevoItemDesc] = useState("");
    const [nuevoItemPrecio, setNuevoItemPrecio] = useState("");
    const [nuevoItemCantidad, setNuevoItemCantidad] = useState(1);
    const [nuevoItemDescuento, setNuevoItemDescuento] = useState(0);

    const [emitiendoFactura, setEmitiendoFactura] = useState(false);

    const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false);
    const [cotizacionCliente, setCotizacionCliente] = useState("");
    const [cotizacionVehiculo, setCotizacionVehiculo] = useState("");
    const [itemsCotizacion, setItemsCotizacion] = useState([]);
    const [nuevoItemCotizacionDesc, setNuevoItemCotizacionDesc] = useState("");
    const [nuevoItemCotizacionPrecio, setNuevoItemCotizacionPrecio] = useState("");
    const [nuevoItemCotizacionCantidad, setNuevoItemCotizacionCantidad] = useState(1);
    const [nuevoItemCotizacionDescuento, setNuevoItemCotizacionDescuento] = useState(0);
    const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);

    // =========================================================
    // MODAL NOTA DE CRÉDITO
    // =========================================================
    const [mostrarModalNC, setMostrarModalNC] = useState(false);
    const [ncFacturaId, setNcFacturaId] = useState("");
    const [ncClienteId, setNcClienteId] = useState("");
    const [ncTipoNota, setNcTipoNota] = useState("Anulación de la operación");
    const [ncMotivo, setNcMotivo] = useState("");
    const [ncMontoTotal, setNcMontoTotal] = useState("");
    const [emitiendoNC, setEmitiendoNC] = useState(false);
    const [consultandoNC, setConsultandoNC] = useState(null);

    // =========================================================
    // MODAL NOTA DE DÉBITO
    // =========================================================
    const [mostrarModalND, setMostrarModalND] = useState(false);
    const [ndFacturaId, setNdFacturaId] = useState("");
    const [ndClienteId, setNdClienteId] = useState("");
    const [ndTipoNota, setNdTipoNota] = useState("Aumento en el valor del servicio");
    const [ndMotivo, setNdMotivo] = useState("");
    const [ndMontoTotal, setNdMontoTotal] = useState("");
    const [emitiendoND, setEmitiendoND] = useState(false);
    const [consultandoND, setConsultandoND] = useState(null);
    const [notasDebitoList, setNotasDebitoList] = useState([]);
    const [cargandoNotasDebito, setCargandoNotasDebito] = useState(false);

    // =========================================================
    // MODAL REGISTRO DE PAGO / CUENTAS POR COBRAR
    // =========================================================
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [facturaAPagar, setFacturaAPagar] = useState(null);
    const [metodoPagoRegistro, setMetodoPagoRegistro] = useState("Efectivo");
    const [observacionesPagoRegistro, setObservacionesPagoRegistro] = useState("");
    const [procesandoPago, setProcesandoPago] = useState(false);
    const [busquedaCxC, setBusquedaCxC] = useState("");
    const [montoPagoRegistro, setMontoPagoRegistro] = useState("");
    const [metodosPagoDisponibles, setMetodosPagoDisponibles] = useState([]);
    const [cajaAbiertaParaPago, setCajaAbiertaParaPago] = useState(false);
    const [errorModalPago, setErrorModalPago] = useState("");
    const [exitoModalPago, setExitoModalPago] = useState("");
    const [revisionCuentas, setRevisionCuentas] = useState(0);
    const [revisionCaja, setRevisionCaja] = useState(0);

    useEffect(() => {
        let activa = true;
        obtenerMetodosPago()
            .then((metodos) => { if (activa) setMetodosPagoDisponibles(metodos); })
            .catch((error) => { if (activa) setErrorModalPago(error.message || "No se pudieron cargar los métodos de pago."); });
        return () => { activa = false; };
    }, []);

    const abrirModalPago = async (facturaOCuenta) => {
        setErrorModalPago("");
        setExitoModalPago("");
        try {
            const cuenta = facturaOCuenta.cuenta_cobrar_id
                ? facturaOCuenta
                : await obtenerCuentaPorFactura(facturaOCuenta.factura_id);
            if (cuenta.estado === "Anulada" || Number(cuenta.saldo) <= 0) {
                throw new Error("La cuenta está anulada o no tiene saldo pendiente.");
            }
            const [metodos, cajaActual] = await Promise.all([
                obtenerMetodosPago(),
                obtenerCajaActual()
            ]);

            if (!usuarioActual?.user_id) {
                throw new Error("No existe un usuario autenticado en la sesión.");
            }

            setFacturaAPagar(cuenta);
            setMontoPagoRegistro(Number(cuenta.saldo).toFixed(2));
            setMetodosPagoDisponibles(metodos);
            setMetodoPagoRegistro(
                metodos.includes(cuenta.metodo_pago)
                    ? cuenta.metodo_pago
                    : (metodos[0] || "")
            );
            setObservacionesPagoRegistro("");
            setCajaAbiertaParaPago(Boolean(cajaActual?.caja_abierta));
            setMostrarModalPago(true);
        } catch (error) {
            setErrorModalPago(error.message || "No se pudo preparar el cobro.");
        }
    };

    const actualizarEstadoCotizacion = async (cotizacionId, accion, motivo = "") => {
        if (!cotizacionId) return;

        try {
            const respuesta = await fetch(`${API_URL}/cotizaciones/${cotizacionId}/${accion}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id: usuarioActual.user_id,
                    motivo: motivo || (accion === "rechazar" ? "Rechazada por validación del administrador" : "Aprobada por el administrador")
                })
            });

            const data = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                throw new Error(data.detail || `No se pudo ${accion} la cotización.`);
            }

            await cargarCotizaciones();
            alert(`Cotización ${accion === "aprobar" ? "aprobada" : "rechazada"} correctamente.`);
            return data;
        } catch (error) {
            console.error(`Error al ${accion} la cotización:`, error);
            alert(error.message || `No se pudo ${accion} la cotización.`);
            return null;
        }
    };

    const confirmarPagoFactura = async () => {
        if (!facturaAPagar) return;

        if (!usuarioActual?.user_id) {
            setErrorModalPago("No existe un usuario autenticado.");
            return;
        }

        if (!cajaAbiertaParaPago) {
            setErrorModalPago("Abre una caja antes de registrar cobros.");
            return;
        }

        if (!metodoPagoRegistro) {
            setErrorModalPago("Selecciona el método de pago.");
            return;
        }

        const monto = Number(montoPagoRegistro);
        const saldo = Number(facturaAPagar.saldo);

        if (!Number.isFinite(monto) || monto <= 0) {
            setErrorModalPago("Ingresa un monto válido.");
            return;
        }

        if (monto > saldo) {
            setErrorModalPago("El monto supera el saldo pendiente.");
            return;
        }

        try {
            setProcesandoPago(true);
            setErrorModalPago("");
            setExitoModalPago("");

            const pago = await registrarPago({
                factura_id: facturaAPagar.factura_id,
                usuario_id: Number(usuarioActual.user_id),
                monto,
                metodo_pago: metodoPagoRegistro,
                observaciones: observacionesPagoRegistro || null
            });

            setExitoModalPago(`Pago ${pago.pago_id} registrado correctamente.`);

            const cuentaActualizada = await obtenerCuentaPorFactura(facturaAPagar.factura_id);
            setFacturaAPagar(cuentaActualizada);
            setMontoPagoRegistro(Number(cuentaActualizada.saldo).toFixed(2));

            await Promise.all([cargarFacturas(), cargarCierresCaja()]);
            setRevisionCuentas((revision) => revision + 1);
            setRevisionCaja((revision) => revision + 1);
        } catch (error) {
            setErrorModalPago(error.message || "No se pudo registrar el pago.");
        } finally {
            setProcesandoPago(false);
        }
    };

    // =========================================================
    // CARGAR FACTURAS
    // =========================================================

    const cargarFacturas = async () => {

        try {

            setCargandoFacturas(true);

            const response = await fetch(
                `${API_URL}/facturacion`
            );

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    "Error HTTP facturas:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `Error ${response.status} al cargar las facturas.`
                );
            }

            const data = await response.json();

            console.log(
                "Facturas recibidas desde PostgreSQL:",
                data
            );

            setFacturasList(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando facturas:",
                error
            );

            setFacturasList([]);

            alert(
                "No se pudieron cargar las facturas desde PostgreSQL."
            );

        } finally {

            setCargandoFacturas(false);

        }
    };

    // =========================================================
    // CARGAR COTIZACIONES
    // =========================================================

    const cargarCotizaciones = async () => {

        try {

            setCargandoCotizaciones(true);

            const response = await fetch(
                `${API_URL}/cotizaciones`
            );

            if (!response.ok) {

                throw new Error(
                    `Error ${response.status} al cargar cotizaciones.`
                );
            }

            const data = await response.json();

            setCotizacionesList(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando cotizaciones:",
                error
            );

            setCotizacionesList([]);

        } finally {

            setCargandoCotizaciones(false);

        }
    };

    // =========================================================
    // CARGAR NOTAS DE CRÉDITO
    // =========================================================

    const cargarNotasCredito = async () => {

        try {

            setCargandoNotasCredito(true);

            const response = await fetch(
                `${API_URL}/notas-credito`
            );

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    "Error HTTP notas de crédito:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `Error ${response.status} al cargar notas de crédito.`
                );
            }

            const data = await response.json();

            console.log(
                "Notas de crédito recibidas:",
                data
            );

            setNotasCreditoList(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando notas de crédito:",
                error
            );

            setNotasCreditoList([]);

            alert(
                "No se pudieron cargar las notas de crédito."
            );

        } finally {

            setCargandoNotasCredito(false);

        }
    };

    // =========================================================
    // CARGAR NOTAS DE DÉBITO
    // =========================================================
    const cargarNotasDebito = async () => {
        try {
            setCargandoNotasDebito(true);

            const response = await fetch(`${API_URL}/notas-debito`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Error HTTP notas de débito:",
                    response.status,
                    errorText
                );
                throw new Error(`Error ${response.status} al cargar notas de débito.`);
            }

            const data = await response.json();

            console.log("Notas de débito recibidas:", data);
            setNotasDebitoList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando notas de débito:", error);
            setNotasDebitoList([]);
            alert("No se pudieron cargar las notas de débito.");
        } finally {
            setCargandoNotasDebito(false);
        }
    };

    // =========================================================
    // CONSULTAR ESTADO SUNAT - NOTA DE CRÉDITO
    // =========================================================
    const consultarEstadoSunatNC = async (nota) => {
        if (!nota?.nota_credito_id) return;

        try {
            setConsultandoNC(nota.nota_credito_id);

            const response = await fetch(
                `${API_URL}/notas-credito/${nota.nota_credito_id}/estado-sunat`
            );

            const data = await response.json();

            if (!response.ok) {
                const mensaje =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail?.mensaje ||
                        data.detail?.error ||
                        "No se pudo consultar el estado SUNAT de la nota de crédito.";
                throw new Error(mensaje);
            }

            setNotasCreditoList((lista) =>
                lista.map((item) =>
                    item.nota_credito_id === nota.nota_credito_id
                        ? {
                            ...item,
                            estado_sunat: data.estado_sunat,
                            codigo_sunat: data.codigo_sunat,
                            respuesta_sunat: data.respuesta_sunat,
                            fecha_envio_sunat: data.fecha_envio_sunat
                        }
                        : item
                )
            );

            alert(
                `Nota de Crédito ${data.numero_nota || nota.numero_nota || ""}: ${data.estado_sunat || "Pendiente"}`
            );
        } catch (error) {
            console.error("Error consultando estado SUNAT NC:", error);
            alert(
                error.message ||
                "No se pudo consultar el estado SUNAT de la nota de crédito."
            );
        } finally {
            setConsultandoNC(null);
        }
    };

    // =========================================================
    // CONSULTAR ESTADO SUNAT - NOTA DE DÉBITO
    // =========================================================
    const consultarEstadoSunatND = async (nota) => {
        if (!nota?.nota_debito_id) return;

        try {
            setConsultandoND(nota.nota_debito_id);

            const response = await fetch(
                `${API_URL}/notas-debito/${nota.nota_debito_id}/estado-sunat`
            );

            const data = await response.json();

            if (!response.ok) {
                const mensaje =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail?.mensaje ||
                        data.detail?.error ||
                        "No se pudo consultar el estado SUNAT de la nota de débito.";
                throw new Error(mensaje);
            }

            setNotasDebitoList((lista) =>
                lista.map((item) =>
                    item.nota_debito_id === nota.nota_debito_id
                        ? {
                            ...item,
                            estado_sunat: data.estado_sunat,
                            codigo_sunat: data.codigo_sunat,
                            respuesta_sunat: data.respuesta_sunat,
                            fecha_envio_sunat: data.fecha_envio_sunat
                        }
                        : item
                )
            );

            alert(
                `Nota de Débito ${data.numero_nota || nota.numero_nota || ""}: ${data.estado_sunat || "Pendiente"}`
            );
        } catch (error) {
            console.error("Error consultando estado SUNAT ND:", error);
            alert(
                error.message ||
                "No se pudo consultar el estado SUNAT de la nota de débito."
            );
        } finally {
            setConsultandoND(null);
        }
    };

    // =========================================================
    // CONSULTAR ESTADO SUNAT - FACTURA / BOLETA
    // =========================================================
    const consultarEstadoSunatFactura = async (factura) => {
        if (!factura?.factura_id) return;

        try {
            setConsultandoFactura(factura.factura_id);

            const response = await fetch(
                `${API_URL}/facturacion/${factura.factura_id}/estado-sunat`
            );

            const data = await response.json();

            if (!response.ok) {
                const mensaje =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail?.mensaje ||
                        data.detail?.error ||
                        "No se pudo consultar el estado SUNAT del comprobante.";
                throw new Error(mensaje);
            }

            setFacturasList((lista) =>
                lista.map((item) =>
                    item.factura_id === factura.factura_id
                        ? {
                            ...item,
                            estado_sunat: data.estado_sunat,
                            codigo_sunat: data.codigo_sunat,
                            respuesta_sunat: data.respuesta_sunat,
                            fecha_envio_sunat: data.fecha_envio_sunat
                        }
                        : item
                )
            );

            alert(
                `Comprobante ${data.numero_comprobante || factura.numero_comprobante || ""}: ${data.estado_sunat || "Actualizado"}`
            );
        } catch (error) {
            console.error("Error consultando estado SUNAT Factura:", error);
            alert(
                error.message ||
                "No se pudo consultar el estado SUNAT del comprobante."
            );
        } finally {
            setConsultandoFactura(null);
        }
    };

    // =========================================================
    // ABRIR MODAL NOTA DE CRÉDITO
    // =========================================================
    const abrirModalNC = (factura = null) => {
        if (factura) {
            setNcFacturaId(factura.factura_id);
            setNcClienteId(factura.cliente_id);
            setNcMontoTotal(factura.total);
            setNcMotivo("Devolución / Corrección de operación");
        } else {
            setNcFacturaId(facturasList.length > 0 ? facturasList[0].factura_id : "");
            setNcClienteId(facturasList.length > 0 ? facturasList[0].cliente_id : "");
            setNcMontoTotal(facturasList.length > 0 ? facturasList[0].total : "");
            setNcMotivo("");
        }
        setNcTipoNota("Anulación de la operación");
        setMostrarModalNC(true);
    };

    // =========================================================
    // EMITIR NOTA DE CRÉDITO
    // =========================================================
    const emitirNotaCreditoFinal = async () => {
        if (!ncFacturaId) {
            alert("Selecciona la factura de referencia.");
            return;
        }

        if (!ncMotivo.trim()) {
            alert("Ingresa el motivo o concepto de la nota de crédito.");
            return;
        }

        if (!ncMontoTotal || Number(ncMontoTotal) <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        const totalNum = Number(Number(ncMontoTotal).toFixed(2));
        const subtotalNum = Number((totalNum / 1.18).toFixed(2));
        const impuestosNum = Number((totalNum - subtotalNum).toFixed(2));

        const codigoMotivoNC = {
            "Anulación de la operación": "01",
            "Devolución total": "06",
            "Devolución parcial": "07",
            "Descuento global": "04",
            "Corrección por error en la descripción": "03"
        };

        try {
            setEmitiendoNC(true);

            const payload = {
                factura_id: Number(ncFacturaId),
                cliente_id: Number(ncClienteId),
                tipo_nota: "Crédito",
                codigo_motivo: codigoMotivoNC[ncTipoNota] || "01",
                motivo: ncMotivo.trim(),
                subtotal: subtotalNum,
                impuestos: impuestosNum,
                total: totalNum,
                detalles: [
                    {
                        item_id: null,
                        descripcion: ncMotivo.trim(),
                        cantidad: 1,
                        precio_unitario: subtotalNum,
                        impuesto: impuestosNum,
                        total: totalNum
                    }
                ]
            };

            console.log("Nota de Crédito enviada al backend:", payload);

            const response = await fetch(`${API_URL}/notas-credito`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                const mensaje =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail?.mensaje ||
                        data.detail?.error ||
                        "Error al emitir la nota de crédito.";
                throw new Error(mensaje);
            }

            alert(
                `Nota de Crédito ${data.numero_nota || ""} registrada correctamente.`
            );

            setMostrarModalNC(false);
            await cargarNotasCredito();
        } catch (error) {
            console.error("Error registrando nota de crédito:", error);
            alert(error.message || "Error al procesar la nota de crédito.");
        } finally {
            setEmitiendoNC(false);
        }
    };

    // =========================================================
    // ABRIR MODAL NOTA DE DÉBITO
    // =========================================================
    const abrirModalND = (factura = null) => {
        if (factura) {
            setNdFacturaId(factura.factura_id);
            setNdClienteId(factura.cliente_id);
            setNdMontoTotal("");
            setNdMotivo("Cargo adicional por servicio");
        } else {
            setNdFacturaId(facturasList.length > 0 ? facturasList[0].factura_id : "");
            setNdClienteId(facturasList.length > 0 ? facturasList[0].cliente_id : "");
            setNdMontoTotal("");
            setNdMotivo("");
        }

        setNdTipoNota("Aumento en el valor del servicio");
        setMostrarModalND(true);
    };

    // =========================================================
    // EMITIR NOTA DE DÉBITO
    // =========================================================
    const emitirNotaDebitoFinal = async () => {
        if (!ndFacturaId) {
            alert("Selecciona el comprobante de referencia.");
            return;
        }

        if (!ndMotivo.trim()) {
            alert("Ingresa el motivo o concepto de la nota de débito.");
            return;
        }

        if (!ndMontoTotal || Number(ndMontoTotal) <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        const totalNum = Number(Number(ndMontoTotal).toFixed(2));
        const subtotalNum = Number((totalNum / 1.18).toFixed(2));
        const impuestosNum = Number((totalNum - subtotalNum).toFixed(2));

        try {
            setEmitiendoND(true);

            const payload = {
                factura_id: Number(ndFacturaId),
                cliente_id: Number(ndClienteId),
                tipo_nota: "Débito",
                codigo_motivo: "02",
                motivo: ndMotivo.trim(),
                subtotal: subtotalNum,
                impuestos: impuestosNum,
                total: totalNum,
                detalles: [
                    {
                        item_id: null,
                        descripcion: ndMotivo.trim(),
                        cantidad: 1,
                        precio_unitario: subtotalNum,
                        impuesto: impuestosNum,
                        total: totalNum
                    }
                ]
            };

            console.log("Nota de Débito enviada al backend:", payload);

            const response = await fetch(`${API_URL}/notas-debito`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                const mensaje =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail?.mensaje ||
                        data.detail?.error ||
                        "No se pudo emitir la nota de débito.";
                throw new Error(mensaje);
            }

            alert(
                `Nota de Débito ${data.numero_nota || ""} registrada correctamente.`
            );

            setMostrarModalND(false);
            setNdFacturaId("");
            setNdClienteId("");
            setNdMontoTotal("");
            setNdMotivo("");

            await cargarNotasDebito();
        } catch (error) {
            console.error("Error registrando nota de débito:", error);
            alert(error.message || "Error al procesar la nota de débito.");
        } finally {
            setEmitiendoND(false);
        }
    };

    // =========================================================
    // CARGAR CIERRES DE CAJA
    // =========================================================

    const cargarCierresCaja = async () => {

        try {

            setCargandoCierresCaja(true);

            const response = await fetch(
                `${API_URL}/cierre-caja`
            );

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    "Error HTTP cierres de caja:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `Error ${response.status} al cargar cierres de caja.`
                );
            }

            const data = await response.json();

            console.log(
                "Cierres de caja recibidos:",
                data
            );

            setCierresCajaList(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando cierres de caja:",
                error
            );

            setCierresCajaList([]);

            alert(
                "No se pudieron cargar los cierres de caja."
            );

        } finally {

            setCargandoCierresCaja(false);

        }
    };

    // =========================================================
    // COTIZACIONES
    // =========================================================

    const abrirModalCotizacion = () => {

        setMostrarModalCotizacion(true);
        setCotizacionCliente("");
        setCotizacionVehiculo("");
        setItemsCotizacion([]);
        setNuevoItemCotizacionDesc("");
        setNuevoItemCotizacionPrecio("");
        setNuevoItemCotizacionCantidad(1);
        setNuevoItemCotizacionDescuento(0);
    };

    const cerrarModalCotizacion = () => {

        if (guardandoCotizacion) return;

        setMostrarModalCotizacion(false);
        setCotizacionCliente("");
        setCotizacionVehiculo("");
        setItemsCotizacion([]);
        setNuevoItemCotizacionDesc("");
        setNuevoItemCotizacionPrecio("");
        setNuevoItemCotizacionCantidad(1);
        setNuevoItemCotizacionDescuento(0);
    };

    const vehiculosClienteCotizacion = vehiculos.filter(
        (vehiculo) =>
            String(vehiculo.cliente_id) === String(cotizacionCliente)
    );

    const totalCotizacion = itemsCotizacion.reduce(
        (total, item) =>
            total +
            (Number(item.cantidad) * Number(item.precio_unitario)) -
            Number(item.descuento || 0),
        0
    );

    const agregarItemCotizacion = () => {

        if (!nuevoItemCotizacionDesc.trim()) {
            alert("Ingresa la descripción del item de la cotización.");
            return;
        }

        if (!nuevoItemCotizacionPrecio || Number(nuevoItemCotizacionPrecio) <= 0) {
            alert("Ingresa un precio válido.");
            return;
        }

        if (!nuevoItemCotizacionCantidad || Number(nuevoItemCotizacionCantidad) <= 0) {
            alert("Ingresa una cantidad válida.");
            return;
        }

        const nuevoItem = {
            id: Date.now(),
            item_id: null,
            descripcion: nuevoItemCotizacionDesc.trim(),
            cantidad: Number(nuevoItemCotizacionCantidad),
            precio_unitario: Number(nuevoItemCotizacionPrecio),
            descuento: Number(nuevoItemCotizacionDescuento) || 0
        };

        setItemsCotizacion((prev) => [...prev, nuevoItem]);
        setNuevoItemCotizacionDesc("");
        setNuevoItemCotizacionPrecio("");
        setNuevoItemCotizacionCantidad(1);
        setNuevoItemCotizacionDescuento(0);
    };

    const eliminarItemCotizacion = (id) => {
        setItemsCotizacion((prev) => prev.filter((item) => item.id !== id));
    };

    const guardarCotizacion = async () => {

        if (!cotizacionCliente) {
            alert("Selecciona un cliente para la cotización.");
            return;
        }

        if (!cotizacionVehiculo) {
            alert("Selecciona un vehículo para la cotización.");
            return;
        }

        if (itemsCotizacion.length === 0) {
            alert("Agrega al menos un item para guardar la cotización.");
            return;
        }

        try {

            setGuardandoCotizacion(true);

            const subtotalCalculado = itemsCotizacion.reduce(
                (acc, item) => acc + (Number(item.cantidad) * Number(item.precio_unitario)),
                0
            );
            const descuentosCalculados = itemsCotizacion.reduce(
                (acc, item) => acc + Number(item.descuento || 0),
                0
            );
            const impuestosCalculados = itemsCotizacion.reduce(
                (acc, item) => {
                    const base = (Number(item.cantidad) * Number(item.precio_unitario)) - Number(item.descuento || 0);
                    return acc + (base * 0.18);
                },
                0
            );

            const payload = {
                cliente_id: Number(cotizacionCliente),
                vehiculo_id: Number(cotizacionVehiculo),
                subtotal: Number(subtotalCalculado.toFixed(2)),
                descuentos: Number(descuentosCalculados.toFixed(2)),
                impuestos: Number(impuestosCalculados.toFixed(2)),
                total: Number(totalCotizacion.toFixed(2)),
                estado: "Pendiente",
                detalles: itemsCotizacion.map((item) => {
                    const subtotal = Number(item.cantidad) * Number(item.precio_unitario);
                    const descuento = Number(item.descuento || 0);
                    const iva = (subtotal - descuento) * 0.18;
                    return {
                        item_id: item.item_id ? Number(item.item_id) : null,
                        descripcion: item.descripcion,
                        cantidad: Number(item.cantidad),
                        precio_unitario: Number(item.precio_unitario),
                        descuento: descuento,
                        impuesto: Number(iva.toFixed(2)),
                        total: Number((subtotal - descuento).toFixed(2))
                    };
                })
            };

            const response = await fetch(`${API_URL}/cotizaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "No se pudo registrar la cotización.");
            }

            alert("Cotización registrada correctamente.");
            setMostrarModalCotizacion(false);
            setCotizacionCliente("");
            setCotizacionVehiculo("");
            setItemsCotizacion([]);
            await cargarCotizaciones();

        } catch (error) {

            console.error("Error registrando cotización:", error);
            alert(error.message || "Ocurrió un error al registrar la cotización.");

        } finally {

            setGuardandoCotizacion(false);

        }
    };

    // =========================================================
    // CARGAR CLIENTES
    // =========================================================

    const cargarClientes = async () => {

        try {

            const response = await fetch(
                `${API_URL}/clientes`
            );

            if (!response.ok) {

                throw new Error(
                    `Error ${response.status} al cargar clientes.`
                );
            }

            const data = await response.json();

            setClientes(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando clientes:",
                error
            );

            setClientes([]);

        }
    };

    // =========================================================
    // CARGAR VEHÍCULOS
    // =========================================================

    const cargarVehiculos = async () => {

        try {

            const response = await fetch(
                `${API_URL}/vehiculos`
            );

            if (!response.ok) {

                throw new Error(
                    `Error ${response.status} al cargar vehículos.`
                );
            }

            const data = await response.json();

            setVehiculos(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando vehículos:",
                error
            );

            setVehiculos([]);

        }
    };

    // =========================================================
    // CARGAR ODS
    // =========================================================

    const cargarOrdenesServicio = async () => {

        try {

            const response = await fetch(
                `${API_URL}/ods`
            );

            if (!response.ok) {

                throw new Error(
                    `Error ${response.status} al cargar ODS.`
                );
            }

            const data = await response.json();

            setOrdenesServicio(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando ODS:",
                error
            );

            setOrdenesServicio([]);

        }
    };

    // =========================================================
    // CARGA INICIAL
    // =========================================================

    useEffect(() => {

        let activa = true;
        queueMicrotask(() => {
            if (!activa) return;
            cargarFacturas();
            cargarNotasCredito();
            cargarNotasDebito();
            cargarCierresCaja();
            cargarClientes();
            cargarVehiculos();
            cargarOrdenesServicio();
        });
        return () => {
            activa = false;
        };

    }, []);

    // =========================================================
    // ABRIR WIZARD
    // =========================================================

    const abrirWizard = () => {

        setMostrarWizard(true);
        setPasoWizard(1);

        setClienteFactura("");
        setVehiculoFactura("");
        setOdsSeleccionada("");

        setTipoComprobante("Factura Electrónica");
        setMetodoPago(metodosPagoDisponibles[0] || "");

        setObservacionesPago("");

        setItemsFactura([]);

        setNuevoItemDesc("");
        setNuevoItemPrecio("");
        setNuevoItemCantidad(1);
        setNuevoItemDescuento(0);
    };

    // =========================================================
    // CERRAR WIZARD
    // =========================================================

    const cerrarWizard = () => {

        if (emitiendoFactura) return;

        setMostrarWizard(false);
        setPasoWizard(1);
    };

    // =========================================================
    // CLIENTE SELECCIONADO
    // =========================================================

    const clienteSeleccionado = clientes.find(
        (cliente) =>
            String(
                cliente.cliente_id ?? cliente.id
            ) === String(clienteFactura)
    );

    // =========================================================
    // TIPO DE COMPROBANTE SEGÚN DOCUMENTO DEL CLIENTE
    // =========================================================

    const obtenerTipoComprobanteCliente = (cliente) => {
        if (!cliente) return "Factura Electrónica";

        const documento = String(
            cliente.documento_identidad || ""
        ).replace(/\D/g, "");

        if (documento.length === 8) {
            return "Boleta Electrónica";
        }

        if (documento.length === 11) {
            return "Factura Electrónica";
        }

        return "Factura Electrónica";
    };

    // =========================================================
    // VEHÍCULOS DEL CLIENTE
    // =========================================================

    const vehiculosCliente = vehiculos.filter(
        (vehiculo) =>
            String(
                vehiculo.cliente_id
            ) === String(clienteFactura)
    );

    // =========================================================
    // ODS DEL CLIENTE SELECCIONADO
    // =========================================================
    const ordenesServicioCliente = ordenesServicio.filter(
        (ods) =>
            String(ods.cliente_id) === String(clienteFactura)
    );

    // =========================================================
    // AGREGAR ÍTEM MANUAL
    // =========================================================

    const agregarItemManual = () => {

        if (!nuevoItemDesc.trim()) {

            alert(
                "Ingresa la descripción del producto o servicio."
            );

            return;
        }

        if (
            !nuevoItemPrecio ||
            Number(nuevoItemPrecio) <= 0
        ) {

            alert(
                "Ingresa un precio válido."
            );

            return;
        }

        if (
            !nuevoItemCantidad ||
            Number(nuevoItemCantidad) <= 0
        ) {

            alert(
                "Ingresa una cantidad válida."
            );

            return;
        }

        const nuevoItem = {

            id: Date.now(),

            item_id: null,

            descripcion: nuevoItemDesc.trim(),

            cantidad: Number(
                nuevoItemCantidad
            ),

            precio_unitario: Number(
                nuevoItemPrecio
            ),

            descuento: Number(
                nuevoItemDescuento
            ) || 0

        };

        setItemsFactura([
            ...itemsFactura,
            nuevoItem
        ]);

        setNuevoItemDesc("");
        setNuevoItemPrecio("");
        setNuevoItemCantidad(1);
        setNuevoItemDescuento(0);
    };

    // =========================================================
    // ELIMINAR ÍTEM
    // =========================================================

    const eliminarItem = (id) => {

        setItemsFactura(
            itemsFactura.filter(
                (item) => item.id !== id
            )
        );
    };

    // =========================================================
    // CÁLCULOS
    // =========================================================

    const subtotalBruto = itemsFactura.reduce(
        (total, item) =>
            total +
            (
                Number(item.cantidad) *
                Number(item.precio_unitario)
            ),
        0
    );

    const totalDescuentos = itemsFactura.reduce(
        (total, item) =>
            total +
            Number(item.descuento || 0),
        0
    );

    const totalNeto = Math.max(
        subtotalBruto - totalDescuentos,
        0
    );

    const baseImponible =
        totalNeto / 1.18;

    const igvMonto =
        totalNeto - baseImponible;

    const totalPagar =
        totalNeto;

    // =========================================================
    // EMITIR FACTURA
    // =========================================================

    const emitirFacturaFinal = async () => {

        if (!clienteFactura) {

            alert(
                "Selecciona un cliente."
            );

            setPasoWizard(1);

            return;
        }

        const documentoCliente = String(
            clienteSeleccionado?.documento_identidad || ""
        ).replace(/\D/g, "");

        if (
            tipoComprobante === "Factura Electrónica" &&
            documentoCliente.length !== 11
        ) {
            alert(
                "La Factura Electrónica requiere que el cliente tenga un RUC de 11 dígitos. Para este cliente corresponde emitir una Boleta Electrónica."
            );

            setTipoComprobante(
                obtenerTipoComprobanteCliente(
                    clienteSeleccionado
                )
            );

            setPasoWizard(1);

            return;
        }

        if (
            tipoComprobante === "Boleta Electrónica" &&
            documentoCliente.length !== 8 &&
            documentoCliente.length !== 11
        ) {
            alert(
                "El cliente no tiene un documento válido para emitir el comprobante."
            );

            setPasoWizard(1);

            return;
        }

        if (!tipoComprobante) {

            alert(
                "Selecciona el tipo de comprobante."
            );

            return;
        }

        if (itemsFactura.length === 0) {

            alert(
                "Debes agregar al menos un ítem."
            );

            setPasoWizard(2);

            return;
        }

        if (!metodoPago) {

            alert(
                "Selecciona un método de pago."
            );

            return;
        }

        try {

            setEmitiendoFactura(true);

            const facturaData = {

                ods_id:
                    odsSeleccionada
                        ? Number(odsSeleccionada)
                        : null,

                cliente_id:
                    Number(clienteFactura),

                tipo_comprobante:
                    tipoComprobante,

                metodo_pago:
                    metodoPago,

                subtotal:
                    Number(
                        baseImponible.toFixed(2)
                    ),

                impuestos:
                    Number(
                        igvMonto.toFixed(2)
                    ),

                descuentos:
                    Number(
                        totalDescuentos.toFixed(2)
                    ),

                total:
                    Number(
                        totalPagar.toFixed(2)
                    ),

                observaciones_pago:
                    observacionesPago || null,

                detalles:
                    itemsFactura.map(
                        (item) => ({

                            item_id:
                                item.item_id
                                    ? Number(item.item_id)
                                    : null,

                            descripcion:
                                item.descripcion,

                            cantidad:
                                Number(item.cantidad),

                            precio_unitario: (() => {
                                const cantidad = Number(item.cantidad) || 0;
                                const precioTotal = Number(item.precio_unitario) || 0;
                                const descuento = Number(item.descuento || 0);
                                const totalLinea = Math.max(
                                    (cantidad * precioTotal) - descuento,
                                    0
                                );
                                const baseLinea = totalLinea / 1.18;

                                return cantidad > 0
                                    ? Number((baseLinea / cantidad).toFixed(10))
                                    : 0;
                            })(),

                            descuento:
                                Number(
                                    item.descuento || 0
                                ),

                            impuesto: (() => {
                                const cantidad = Number(item.cantidad) || 0;
                                const precioTotal = Number(item.precio_unitario) || 0;
                                const descuento = Number(item.descuento || 0);

                                // El precio ingresado en el formulario es el TOTAL
                                // de la línea, es decir, incluye IGV.
                                const totalLinea = Math.max(
                                    (cantidad * precioTotal) - descuento,
                                    0
                                );

                                // Separamos el IGV del precio final.
                                const baseLinea = totalLinea / 1.18;
                                const igvLinea = totalLinea - baseLinea;

                                return Number(igvLinea.toFixed(2));
                            })(),

                            total: (() => {
                                const cantidad = Number(item.cantidad) || 0;
                                const precioTotal = Number(item.precio_unitario) || 0;
                                const descuento = Number(item.descuento || 0);

                                const totalLinea = Math.max(
                                    (cantidad * precioTotal) - descuento,
                                    0
                                );

                                return Number(totalLinea.toFixed(2));
                            })()

                        })
                    )
            };

            console.log(
                "Factura enviada al backend:",
                facturaData
            );

            const response = await fetch(
                `${API_URL}/facturacion`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        facturaData
                    )
                }
            );

            const data =
                await response.json();

            console.log(
                "Respuesta del backend:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "No se pudo registrar la factura."
                );
            }

            alert(
                "Factura registrada correctamente en PostgreSQL."
            );

            setMostrarWizard(false);
            setPasoWizard(1);

            await cargarFacturas();

        } catch (error) {

            console.error(
                "Error registrando factura:",
                error
            );

            alert(
                error.message ||
                "Ocurrió un error al registrar la factura."
            );

        } finally {

            setEmitiendoFactura(false);

        }
    };

    // =========================================================
    // FORMATEAR MONEDA
    // =========================================================

    const moneda = (valor) => {

        return `S/ ${Number(
            valor || 0
        ).toFixed(2)}`;
    };

    // =========================================================
    // FORMATEAR FECHA
    // =========================================================

    const fecha = (valor) => {

        if (!valor) return "-";

        const fechaFormateada =
            new Date(valor);

        if (
            Number.isNaN(
                fechaFormateada.getTime()
            )
        ) {
            return "-";
        }

        return fechaFormateada.toLocaleDateString(
            "es-PE"
        );
    };

    // =========================================================
    // NOMBRE CLIENTE
    // =========================================================

    const obtenerNombreCliente = (clienteId) => {

        const cliente = clientes.find(
            (item) =>
                String(
                    item.cliente_id ?? item.id
                ) === String(clienteId)
        );

        if (!cliente) {
            return clienteId || "-";
        }

        return (
            cliente.nombre_razon_social ||
            cliente.nombre ||
            cliente.razon_social ||
            cliente.cliente_id
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="facturacion-page">

            {errorModalPago && !mostrarModalPago && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{errorModalPago}</div>}

            {/* =================================================
                CABECERA
            ================================================= */}

            <div className="facturacion-header">
                <div>
                    <h2>Ingresos y Facturación Electrónica</h2>
                    <p>Gestión comercial, cotizaciones, cobranzas y comprobantes SUNAT de VeraMotors.</p>
                </div>

                <div className="facturacion-header-actions">
                    <button
                        className="btn-nueva-factura"
                        onClick={abrirWizard}
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* =================================================
                PESTAÑAS
            ================================================= */}

            <div className="fact-tabs-nav">
                {SUBMENUS_FACTURACION.map(
                    (sub) => (
                        <button
                            key={sub}
                            className={`fact-tab-btn ${submodulo === sub ? "active" : ""}`}
                            onClick={() =>
                                setSubmodulo(sub)
                            }
                        >
                            {sub}
                        </button>
                    )
                )}
            </div>

            {/* =================================================
                FACTURAS
            ================================================= */}

            {submodulo === "Facturas" && (

                <div className="os-table-wrapper">
                    <table className="os-table fact-table">
                        <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Fecha Emisión</th>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th className="vm-num">Subtotal</th>
                                <th className="vm-num">IGV</th>
                                <th className="vm-num">Total</th>
                                <th>Estado Pago</th>
                                <th>Estado SUNAT</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {cargandoFacturas ? (
                                <tr>
                                    <td colSpan="10">
                                        <div className="vm-loading fact-loading">Cargando facturas...</div>
                                    </td>
                                </tr>
                            ) : facturasList.length === 0 ? (
                                <tr>
                                    <td colSpan="10">
                                        <div className="vm-empty">
                                            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                                            <strong>No existen facturas registradas.</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                facturasList.map(
                                    (factura) => (
                                        <tr key={factura.factura_id}>
                                            <td>
                                                <span className="vm-code">{factura.numero_comprobante}</span>
                                            </td>
                                            <td>{fecha(factura.fecha_emision)}</td>
                                            <td>
                                                {
                                                    factura.cliente_nombre ||
                                                    factura.nombre_razon_social ||
                                                    obtenerNombreCliente(
                                                        factura.cliente_id
                                                    )
                                                }
                                            </td>
                                            <td>{factura.tipo_comprobante}</td>
                                            <td className="vm-num">{moneda(factura.subtotal)}</td>
                                            <td className="vm-num">{moneda(factura.impuestos)}</td>
                                            <td className="vm-num"><strong>{moneda(factura.total)}</strong></td>
                                            <td>
                                                <span className={`vm-badge ${factura.estado_pago === "Pagado" ? "vm-badge-success" : factura.estado_pago === "Anulado" ? "vm-badge-danger" : "vm-badge-warning"}`}>
                                                    {factura.estado_pago || "Pendiente"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`vm-badge ${factura.estado_sunat === "Aceptado" ? "vm-badge-success" : factura.estado_sunat === "Rechazado" || factura.estado_sunat === "Anulado" ? "vm-badge-danger" : "vm-badge-warning"}`}>
                                                    {factura.estado_sunat || "Pendiente"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions fact-row-actions">

                                                    <a
                                                        href={`${API_URL}/facturacion/${factura.factura_id}/pdf?formato=A4`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => abrirDocumentoProtegido(e, `${API_URL}/facturacion/${factura.factura_id}/pdf?formato=A4`)}
                                                        className="btn-act-table link"
                                                        title="Ver / Descargar PDF oficial generado por APISUNAT"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                                                        PDF
                                                    </a>

                                                    <button
                                                        type="button"
                                                        className="btn-act-table"
                                                        onClick={() => consultarEstadoSunatFactura(factura)}
                                                        disabled={consultandoFactura === factura.factura_id}
                                                        title="Consultar estado del comprobante directamente en APISUNAT"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">sync</span>
                                                        {consultandoFactura === factura.factura_id ? "Consultando..." : "Consultar"}
                                                    </button>

                                                    {factura.estado_sunat === "Aceptado" && (
                                                        <>
                                                            <a
                                                                href={`${API_URL}/facturacion/${factura.factura_id}/xml`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => abrirDocumentoProtegido(e, `${API_URL}/facturacion/${factura.factura_id}/xml`)}
                                                                className="btn-act-table"
                                                                title="Descargar XML firmado de APISUNAT"
                                                            >
                                                                <span className="material-symbols-outlined" aria-hidden="true">code</span>
                                                                XML
                                                            </a>
                                                            <a
                                                                href={`${API_URL}/facturacion/${factura.factura_id}/cdr`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => abrirDocumentoProtegido(e, `${API_URL}/facturacion/${factura.factura_id}/cdr`)}
                                                                className="btn-act-table"
                                                                title="Descargar Constancia de Recepción (CDR) de SUNAT"
                                                            >
                                                                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                                                                CDR
                                                            </a>
                                                        </>
                                                    )}

                                                    {factura.estado_pago !== "Pagado" && factura.estado_pago !== "Anulado" && (
                                                        <button
                                                            className="btn-act-table fact-act-primary"
                                                            type="button"
                                                            onClick={() => abrirModalPago(factura)}
                                                            title="Registrar cobro / pago de este comprobante"
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">payments</span>
                                                            Cobrar
                                                        </button>
                                                    )}

                                                    <button
                                                        className="btn-act-table"
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalNC(factura)
                                                        }
                                                        title="Emitir Nota de Crédito por anulación, devolución o descuento"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">remove_circle</span>
                                                        Nota Crédito
                                                    </button>

                                                    <button
                                                        className="btn-act-table"
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalND(factura)
                                                        }
                                                        title="Emitir Nota de Débito por aumento en el valor del servicio"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                                                        Nota Débito
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

            )}

            {/* =================================================
                NOTAS DE CRÉDITO
            ================================================= */}

            {submodulo === "Notas de Crédito" && (

                <div className="vm-card fact-panel">

                    <div className="vm-card-head fact-panel-head">
                        <div>
                            <h3>Notas de Crédito</h3>
                            <p>Notas de crédito registradas en PostgreSQL.</p>
                        </div>

                        <button
                            type="button"
                            className="vm-btn vm-btn-primary"
                            onClick={() => abrirModalNC()}
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">add</span>
                            Nueva Nota de Crédito
                        </button>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table fact-table">
                            <thead>
                                <tr>
                                    <th>N° Nota</th>
                                    <th>Fecha</th>
                                    <th>Factura</th>
                                    <th>Cliente</th>
                                    <th>Tipo</th>
                                    <th>Motivo</th>
                                    <th className="vm-num">Subtotal</th>
                                    <th className="vm-num">IGV</th>
                                    <th className="vm-num">Total</th>
                                    <th>Estado SUNAT</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargandoNotasCredito ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-loading fact-loading">Cargando notas de crédito...</div>
                                        </td>
                                    </tr>
                                ) : notasCreditoList.length === 0 ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-empty">
                                                <span className="material-symbols-outlined" aria-hidden="true">remove_circle</span>
                                                <strong>No existen notas de crédito registradas.</strong>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    notasCreditoList.map(
                                        (nota) => (
                                            <tr key={nota.nota_credito_id}>
                                                <td><span className="vm-code">{nota.numero_nota}</span></td>
                                                <td>{fecha(nota.fecha_emision)}</td>
                                                <td><span className="vm-code">{nota.numero_factura || nota.factura_id}</span></td>
                                                <td className="fact-cell-client">
                                                    {
                                                        nota.cliente_nombre ||
                                                        nota.nombre_razon_social ||
                                                        obtenerNombreCliente(
                                                            nota.cliente_id
                                                        )
                                                    }
                                                </td>
                                                <td>{nota.tipo_nota}</td>
                                                <td className="fact-cell-text">{nota.motivo}</td>
                                                <td className="vm-num">{moneda(nota.subtotal)}</td>
                                                <td className="vm-num">{moneda(nota.impuestos)}</td>
                                                <td className="vm-num"><strong>{moneda(nota.total)}</strong></td>
                                                <td>
                                                    <div className="table-actions fact-status-actions">
                                                        <span className={`vm-badge ${nota.estado_sunat === "Aceptado" ? "vm-badge-success" : nota.estado_sunat === "Rechazado" || nota.estado_sunat === "Anulado" ? "vm-badge-danger" : "vm-badge-warning"}`}>
                                                            {nota.estado_sunat || "Pendiente"}
                                                        </span>

                                                        <a
                                                            href={`${API_URL}/notas-credito/${nota.nota_credito_id}/pdf?formato=A4`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => abrirDocumentoProtegido(e, `${API_URL}/notas-credito/${nota.nota_credito_id}/pdf?formato=A4`)}
                                                            className="btn-act-table link"
                                                            title="Ver / Descargar PDF oficial generado por APISUNAT"
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                                                            PDF
                                                        </a>

                                                        <button
                                                            type="button"
                                                            className="btn-act-table"
                                                            onClick={() =>
                                                                consultarEstadoSunatNC(nota)
                                                            }
                                                            disabled={
                                                                consultandoNC ===
                                                                nota.nota_credito_id
                                                            }
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
                                                            {consultandoNC ===
                                                                nota.nota_credito_id
                                                                ? "Consultando..."
                                                                : "Consultar"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            )}

            {/* =================================================
                NOTAS DE DÉBITO
            ================================================= */}

            {submodulo === "Notas de Débito" && (

                <div className="vm-card fact-panel">

                    <div className="vm-card-head fact-panel-head">
                        <div>
                            <h3>Notas de Débito</h3>
                            <p>Notas de débito registradas en PostgreSQL.</p>
                        </div>

                        <button
                            type="button"
                            className="vm-btn vm-btn-primary"
                            onClick={() => abrirModalND()}
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">add</span>
                            Nueva Nota de Débito
                        </button>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table fact-table">
                            <thead>
                                <tr>
                                    <th>N° Nota</th>
                                    <th>Fecha</th>
                                    <th>Factura</th>
                                    <th>Cliente</th>
                                    <th>Tipo</th>
                                    <th>Motivo</th>
                                    <th className="vm-num">Subtotal</th>
                                    <th className="vm-num">IGV</th>
                                    <th className="vm-num">Total</th>
                                    <th>Estado SUNAT</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargandoNotasDebito ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-loading fact-loading">Cargando notas de débito...</div>
                                        </td>
                                    </tr>
                                ) : notasDebitoList.length === 0 ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-empty">
                                                <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                                                <strong>No existen notas de débito registradas.</strong>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    notasDebitoList.map((nota) => (
                                        <tr key={nota.nota_debito_id}>
                                            <td><span className="vm-code">{nota.numero_nota}</span></td>
                                            <td>{fecha(nota.fecha_emision)}</td>
                                            <td><span className="vm-code">{nota.numero_factura || nota.factura_id || "-"}</span></td>
                                            <td className="fact-cell-client">
                                                {nota.cliente_nombre ||
                                                    nota.nombre_razon_social ||
                                                    obtenerNombreCliente(nota.cliente_id)}
                                            </td>
                                            <td>{nota.tipo_nota || "Débito"}</td>
                                            <td className="fact-cell-text">{nota.motivo || "-"}</td>
                                            <td className="vm-num">{moneda(nota.subtotal)}</td>
                                            <td className="vm-num">{moneda(nota.impuestos)}</td>
                                            <td className="vm-num"><strong>{moneda(nota.total)}</strong></td>
                                            <td>
                                                <div className="table-actions fact-status-actions">
                                                    <span className={`vm-badge ${nota.estado_sunat === "Aceptado" ? "vm-badge-success" : nota.estado_sunat === "Rechazado" || nota.estado_sunat === "Anulado" ? "vm-badge-danger" : "vm-badge-warning"}`}>
                                                        {nota.estado_sunat || "Pendiente"}
                                                    </span>

                                                    <a
                                                        href={`${API_URL}/notas-debito/${nota.nota_debito_id}/pdf?formato=A4`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => abrirDocumentoProtegido(e, `${API_URL}/notas-debito/${nota.nota_debito_id}/pdf?formato=A4`)}
                                                        className="btn-act-table link"
                                                        title="Ver / Descargar PDF oficial generado por APISUNAT"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                                                        PDF
                                                    </a>

                                                    <button
                                                        type="button"
                                                        className="btn-act-table"
                                                        onClick={() =>
                                                            consultarEstadoSunatND(nota)
                                                        }
                                                        disabled={
                                                            consultandoND ===
                                                            nota.nota_debito_id
                                                        }
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">sync</span>
                                                        {consultandoND ===
                                                            nota.nota_debito_id
                                                            ? "Consultando..."
                                                            : "Consultar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

            {/* =================================================
                CUENTAS POR COBRAR
            ================================================= */}

            {/* =================================================
                CUENTAS POR COBRAR
            ================================================= */}

            {submodulo === "Cuentas por Cobrar" && (
                <CuentasPorCobrar onCobrar={abrirModalPago} refreshKey={revisionCuentas} />
            )}

            {submodulo === "Cuentas por Cobrar Legacy" && (() => {
                const cuentasPendientes = facturasList.filter((f) => {
                    const est = (f.estado_pago || "Pendiente").toLowerCase();
                    return est !== "pagado";
                });

                const cuentasFiltradas = cuentasPendientes.filter((f) => {
                    const q = busquedaCxC.toLowerCase();
                    const clienteNom = (f.cliente_nombre || obtenerNombreCliente(f.cliente_id) || "").toLowerCase();
                    const numComp = (f.numero_comprobante || "").toLowerCase();
                    return numComp.includes(q) || clienteNom.includes(q);
                });

                const totalPorCobrar = cuentasPendientes.reduce((acc, f) => acc + Number(f.total || 0), 0);

                return (
                    <div>
                        {/* TARJETAS DE RESUMEN KPI */}
                        <div className="vm-kpi-grid">
                            <div className="vm-kpi">
                                <span className="vm-kpi-label">Total por Cobrar</span>
                                <strong className="vm-kpi-value fact-kpi-danger">{moneda(totalPorCobrar)}</strong>
                                <small className="fact-hint">Suma de facturas y boletas pendientes</small>
                            </div>

                            <div className="vm-kpi">
                                <span className="vm-kpi-label">Comprobantes Pendientes</span>
                                <strong className="vm-kpi-value">{cuentasPendientes.length}</strong>
                                <small className="fact-hint">Documentos pendientes de cobro</small>
                            </div>

                            <div className="vm-kpi">
                                <span className="vm-kpi-label">Comprobantes Pagados</span>
                                <strong className="vm-kpi-value">{facturasList.filter(f => (f.estado_pago || "").toLowerCase() === "pagado").length}</strong>
                                <small className="fact-hint">Operaciones ya saldadas</small>
                            </div>
                        </div>

                        {/* TABLA DE CUENTAS POR COBRAR */}
                        <div className="vm-card fact-panel">
                            <div className="vm-card-head fact-panel-head">
                                <div>
                                    <h3>Listado de Cuentas por Cobrar</h3>
                                    <p>Solo se muestran comprobantes con estado de pago <strong>Pendiente</strong>. Al pagar, se retirarán automáticamente de esta sección.</p>
                                </div>

                                <div className="fact-panel-search">
                                    <div className="vm-search">
                                        <span className="material-symbols-outlined" aria-hidden="true">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar por N° Comprobante o Cliente..."
                                            value={busquedaCxC}
                                            onChange={(e) => setBusquedaCxC(e.target.value)}
                                        />
                                    </div>
                                    {busquedaCxC && (
                                        <button
                                            type="button"
                                            className="vm-btn vm-btn-secondary"
                                            onClick={() => setBusquedaCxC("")}
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="os-table-wrapper">
                                <table className="os-table fact-table">
                                    <thead>
                                        <tr>
                                            <th>N° Comprobante</th>
                                            <th>Tipo</th>
                                            <th>Fecha Emisión</th>
                                            <th>Cliente</th>
                                            <th>Método Pactado</th>
                                            <th className="vm-num">Total Pendiente</th>
                                            <th>Estado de Pago</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cargandoFacturas ? (
                                            <tr>
                                                <td colSpan="8">
                                                    <div className="vm-loading fact-loading">Cargando cuentas por cobrar...</div>
                                                </td>
                                            </tr>
                                        ) : cuentasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan="8">
                                                    <div className="vm-empty">
                                                        <span className="material-symbols-outlined" aria-hidden="true">task_alt</span>
                                                        <strong>
                                                            {cuentasPendientes.length === 0
                                                                ? "¡No hay cuentas pendientes por cobrar!"
                                                                : "No se encontraron comprobantes con el criterio de búsqueda."}
                                                        </strong>
                                                        <span>
                                                            {cuentasPendientes.length === 0
                                                                ? "Todos los comprobantes emitidos han sido pagados y regularizados."
                                                                : "Intente con otro nombre de cliente o número de serie."}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            cuentasFiltradas.map((factura) => (
                                                <tr key={factura.factura_id}>
                                                    <td>
                                                        <span className="vm-code">{factura.numero_comprobante}</span>
                                                    </td>
                                                    <td>{factura.tipo_comprobante}</td>
                                                    <td>{fecha(factura.fecha_emision)}</td>
                                                    <td>
                                                        <strong>
                                                            {factura.cliente_nombre ||
                                                                factura.nombre_razon_social ||
                                                                obtenerNombreCliente(factura.cliente_id)}
                                                        </strong>
                                                    </td>
                                                    <td>{factura.metodo_pago || "Efectivo"}</td>
                                                    <td className="vm-num">
                                                        <strong>{moneda(factura.total)}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="vm-badge vm-badge-warning">
                                                            {factura.estado_pago || "Pendiente"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-act-table fact-act-primary"
                                                            onClick={() => abrirModalPago(factura)}
                                                            title="Registrar pago / saldar comprobante"
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">payments</span>
                                                            Registrar Pago
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* =================================================
<<<<<<< HEAD
=======
                REMISIONES
            ================================================= */}

            {submodulo === "Remisiones" && <Remisiones />}

            {submodulo === "RemisionesLegacy" && (

                <div className="vm-card fact-panel">

                    <div className="vm-card-head fact-panel-head">
                        <div>
                            <h3>Remisiones</h3>
                            <p>Guías de remisión registradas en PostgreSQL.</p>
                        </div>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table fact-table">
                            <thead>
                                <tr>
                                    <th>N° Remisión</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Vehículo</th>
                                    <th>ODS</th>
                                    <th>Motivo Traslado</th>
                                    <th>Punto Partida</th>
                                    <th>Punto Llegada</th>
                                    <th>Estado</th>
                                    <th>Estado SUNAT</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargandoRemisiones ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-loading fact-loading">Cargando remisiones...</div>
                                        </td>
                                    </tr>
                                ) : remisionesList.length === 0 ? (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="vm-empty">
                                                <span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>
                                                <strong>No existen remisiones registradas.</strong>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    remisionesList.map(
                                        (remision) => (
                                            <tr key={remision.remision_id}>
                                                <td><span className="vm-code">{remision.numero_remision}</span></td>
                                                <td>{fecha(remision.fecha_emision)}</td>
                                                <td>
                                                    {
                                                        remision.cliente_nombre ||
                                                        remision.nombre_razon_social ||
                                                        obtenerNombreCliente(
                                                            remision.cliente_id
                                                        )
                                                    }
                                                </td>
                                                <td>
                                                    {obtenerVehiculo(
                                                        remision.vehiculo_id
                                                    )}
                                                </td>
                                                <td>{remision.ods_id || "-"}</td>
                                                <td>{remision.motivo_traslado}</td>
                                                <td>{remision.punto_partida || "-"}</td>
                                                <td>{remision.punto_llegada || "-"}</td>
                                                <td>
                                                    <span className={`vm-badge ${remision.estado === "Emitida" || remision.estado === "Aceptada" ? "vm-badge-success" : "vm-badge-warning"}`}>
                                                        {remision.estado || "Pendiente"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`vm-badge ${remision.estado_sunat === "Aceptado" ? "vm-badge-success" : remision.estado_sunat === "Rechazado" || remision.estado_sunat === "Anulado" ? "vm-badge-danger" : "vm-badge-warning"}`}>
                                                        {remision.estado_sunat || "Pendiente"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            )}

            {/* =================================================
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                CIERRE DE CAJA
            ================================================= */}

            {submodulo === "Cierre de Caja" && <Caja refreshKey={revisionCaja} />}

            {submodulo === "Cierre de Caja Legacy" && (

                <div className="vm-card fact-panel">

                    <div className="vm-card-head fact-panel-head">
                        <div>
                            <h3>Cierre de Caja</h3>
                            <p>Historial de cierres de caja registrados en PostgreSQL.</p>
                        </div>
                    </div>

                    <div className="os-table-wrapper">
                        <table className="os-table fact-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Apertura</th>
                                    <th>Cierre</th>
                                    <th>Usuario</th>
                                    <th className="vm-num">Monto Inicial</th>
                                    <th className="vm-num">Efectivo</th>
                                    <th className="vm-num">Yape</th>
                                    <th className="vm-num">Plin</th>
                                    <th className="vm-num">Tarjeta</th>
                                    <th className="vm-num">Transferencia</th>
                                    <th className="vm-num">Total Ventas</th>
                                    <th className="vm-num">Esperado</th>
                                    <th className="vm-num">Real</th>
                                    <th className="vm-num">Diferencia</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargandoCierresCaja ? (
                                    <tr>
                                        <td colSpan="15">
                                            <div className="vm-loading fact-loading">Cargando cierres de caja...</div>
                                        </td>
                                    </tr>
                                ) : cierresCajaList.length === 0 ? (
                                    <tr>
                                        <td colSpan="15">
                                            <div className="vm-empty">
                                                <span className="material-symbols-outlined" aria-hidden="true">point_of_sale</span>
                                                <strong>No existen cierres de caja registrados.</strong>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cierresCajaList.map(
                                        (cierre) => (
                                            <tr key={cierre.cierre_caja_id}>
                                                <td><span className="vm-code">{cierre.cierre_caja_id}</span></td>
                                                <td>{fecha(cierre.fecha_apertura)}</td>
                                                <td>{fecha(cierre.fecha_cierre)}</td>
                                                <td>
                                                    {
                                                        cierre.usuario_nombre ||
                                                        cierre.usuario_id
                                                    }
                                                </td>
                                                <td className="vm-num">{moneda(cierre.monto_inicial)}</td>
                                                <td className="vm-num">{moneda(cierre.total_efectivo)}</td>
                                                <td className="vm-num">{moneda(cierre.total_yape)}</td>
                                                <td className="vm-num">{moneda(cierre.total_plin)}</td>
                                                <td className="vm-num">{moneda(cierre.total_tarjeta)}</td>
                                                <td className="vm-num">{moneda(cierre.total_transferencia)}</td>
                                                <td className="vm-num"><strong>{moneda(cierre.total_ventas)}</strong></td>
                                                <td className="vm-num">{moneda(cierre.total_esperado)}</td>
                                                <td className="vm-num">{moneda(cierre.monto_real)}</td>
                                                <td className="vm-num"><strong>{moneda(cierre.diferencia)}</strong></td>
                                                <td>
                                                    <span className={`vm-badge ${cierre.estado === "Cerrada" ? "is-plain" : "vm-badge-success"}`}>
                                                        {cierre.estado || "Pendiente"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            )}

            {/* =================================================
                WIZARD
            ================================================= */}

            {mostrarWizard && (

                <div className="modal-overlay">

                    <div className="modal-content fact-modal-wide">

                        {/* HEADER */}

                        <div className="modal-header">
                            <div>
                                <h2>Emisión de{" "}{tipoComprobante}</h2>
                                <p>
                                    Paso{" "}{pasoWizard}{" "}de 3 ·{" "}
                                    {
                                        pasoWizard === 1
                                            ? "Selección de Cliente / ODS"
                                            : pasoWizard === 2
                                                ? "Carga de Detalle de Ítems"
                                                : "Método de Pago & Emisión"
                                    }
                                </p>
                            </div>

                            <button
                                className="btn-close"
                                onClick={
                                    cerrarWizard
                                }
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>

                        {/* PASOS */}

                        <div className="wizard-steps-bar">
                            <div className={`step-item ${pasoWizard === 1 ? "active" : pasoWizard > 1 ? "done" : ""}`}>
                                <span className="step-num">1</span>
                                <span>Cliente / ODS</span>
                            </div>

                            <div className={`step-item ${pasoWizard === 2 ? "active" : pasoWizard > 2 ? "done" : ""}`}>
                                <span className="step-num">2</span>
                                <span>Ítems</span>
                            </div>

                            <div className={`step-item ${pasoWizard === 3 ? "active" : ""}`}>
                                <span className="step-num">3</span>
                                <span>Pago & Emisión</span>
                            </div>
                        </div>

                        {/* BODY */}

                        <div className="modal-body">

                            {/* PASO 1 */}

                            {pasoWizard === 1 && (

                                <div className="fact-form-sections">

                                    <div>
                                        <div className="vm-form-section-title">
                                            <span className="material-symbols-outlined" aria-hidden="true">description</span>
                                            Comprobante y cliente
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Tipo de Comprobante *</label>
                                                <select
                                                    value={
                                                        tipoComprobante
                                                    }
                                                    onChange={
                                                        (e) =>
                                                            setTipoComprobante(
                                                                e.target.value
                                                            )
                                                    }
                                                >
                                                    <option>Factura Electrónica</option>
                                                    <option>Boleta Electrónica</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Seleccionar Cliente *</label>
                                                <select
                                                    value={
                                                        clienteFactura
                                                    }
                                                    onChange={
                                                        (e) => {

                                                            const nuevoClienteId =
                                                                e.target.value;

                                                            setClienteFactura(
                                                                nuevoClienteId
                                                            );

                                                            setVehiculoFactura(
                                                                ""
                                                            );

                                                            setOdsSeleccionada(
                                                                ""
                                                            );

                                                            const cliente =
                                                                clientes.find(
                                                                    (item) =>
                                                                        String(
                                                                            item.cliente_id ??
                                                                            item.id
                                                                        ) ===
                                                                        String(
                                                                            nuevoClienteId
                                                                        )
                                                                );

                                                            setTipoComprobante(
                                                                obtenerTipoComprobanteCliente(
                                                                    cliente
                                                                )
                                                            );

                                                        }
                                                    }
                                                >
                                                    <option value="">Seleccionar cliente...</option>

                                                    {clientes.map(
                                                        (cliente) => (
                                                            <option
                                                                key={
                                                                    cliente.cliente_id
                                                                }
                                                                value={
                                                                    cliente.cliente_id
                                                                }
                                                            >
                                                                {cliente.nombre_razon_social}{" - "}{cliente.documento_identidad}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="vm-form-section-title">
                                            <span className="material-symbols-outlined" aria-hidden="true">directions_car</span>
                                            Vehículo y orden de servicio
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Vehículo / Placa</label>
                                                <select
                                                    value={
                                                        vehiculoFactura
                                                    }
                                                    onChange={
                                                        (e) =>
                                                            setVehiculoFactura(
                                                                e.target.value
                                                            )
                                                    }
                                                >
                                                    <option value="">Seleccionar vehículo...</option>

                                                    {vehiculosCliente.map(
                                                        (vehiculo) => (
                                                            <option
                                                                key={
                                                                    vehiculo.vehiculo_id
                                                                }
                                                                value={
                                                                    vehiculo.vehiculo_id
                                                                }
                                                            >
                                                                {vehiculo.marca}{" "}{vehiculo.modelo}{" ("}{vehiculo.placa}{")"}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Orden de Servicio (ODS)</label>
                                                <select
                                                    value={
                                                        odsSeleccionada
                                                    }
                                                    onChange={
                                                        (e) =>
                                                            setOdsSeleccionada(
                                                                e.target.value
                                                            )
                                                    }
                                                >
                                                    <option value="">Sin ODS</option>

                                                    {ordenesServicioCliente.map(
                                                        (ods) => (
                                                            <option
                                                                key={
                                                                    ods.ods_id
                                                                }
                                                                value={
                                                                    ods.ods_id
                                                                }
                                                            >
                                                                {ods.codigo_ods}{" - "}{ods.estado_actual}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            )}

                            {/* PASO 2 */}

                            {pasoWizard === 2 && (

                                <div className="fact-form-sections">

                                    <div>
                                        <h4 className="vm-form-section-title">
                                            <span className="material-symbols-outlined" aria-hidden="true">list_alt</span>
                                            Detalle de Ítems a Facturar
                                        </h4>

                                        <div className="vm-table-wrap">
                                            <table className="os-table fact-items-table">
                                                <thead>
                                                    <tr>
                                                        <th>Descripción</th>
                                                        <th className="vm-num">Cant.</th>
                                                        <th className="vm-num">Precio</th>
                                                        <th className="vm-num">Desc.</th>
                                                        <th className="vm-num">Total</th>
                                                        <th>Acción</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {itemsFactura.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6">
                                                                <div className="vm-empty fact-empty-compact">
                                                                    <span className="material-symbols-outlined" aria-hidden="true">playlist_add</span>
                                                                    <strong>No hay ítems agregados.</strong>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        itemsFactura.map(
                                                            (item) => {

                                                                const totalItem =
                                                                    (
                                                                        Number(
                                                                            item.cantidad
                                                                        ) *
                                                                        Number(
                                                                            item.precio_unitario
                                                                        )
                                                                    ) -
                                                                    Number(
                                                                        item.descuento ||
                                                                        0
                                                                    );

                                                                return (
                                                                    <tr key={item.id}>
                                                                        <td>{item.descripcion}</td>
                                                                        <td className="vm-num">{item.cantidad}</td>
                                                                        <td className="vm-num">{moneda(item.precio_unitario)}</td>
                                                                        <td className="vm-num">{moneda(item.descuento)}</td>
                                                                        <td className="vm-num"><strong>{moneda(totalItem)}</strong></td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-act-table fact-act-danger"
                                                                                onClick={() =>
                                                                                    eliminarItem(
                                                                                        item.id
                                                                                    )
                                                                                }
                                                                                aria-label="Eliminar ítem"
                                                                                title="Eliminar ítem"
                                                                            >
                                                                                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );

                                                            }
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* AGREGAR ITEM */}

                                    <div className="fact-add-item">
                                        <label className="fact-add-field fact-add-desc">
                                            Descripción
                                            <input
                                                type="text"
                                                placeholder="Descripción..."
                                                value={
                                                    nuevoItemDesc
                                                }
                                                onChange={
                                                    (e) =>
                                                        setNuevoItemDesc(
                                                            e.target.value
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="fact-add-field">
                                            Cantidad
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Cantidad"
                                                value={
                                                    nuevoItemCantidad
                                                }
                                                onChange={
                                                    (e) =>
                                                        setNuevoItemCantidad(
                                                            e.target.value
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="fact-add-field">
                                            Precio
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Precio S/"
                                                value={
                                                    nuevoItemPrecio
                                                }
                                                onChange={
                                                    (e) =>
                                                        setNuevoItemPrecio(
                                                            e.target.value
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="fact-add-field">
                                            Descuento
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Descuento"
                                                value={
                                                    nuevoItemDescuento
                                                }
                                                onChange={
                                                    (e) =>
                                                        setNuevoItemDescuento(
                                                            e.target.value
                                                        )
                                                }
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            className="vm-btn vm-btn-primary"
                                            onClick={
                                                agregarItemManual
                                            }
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">add</span>
                                            Añadir
                                        </button>
                                    </div>

                                </div>

                            )}

                            {/* PASO 3 */}

                            {pasoWizard === 3 && (

                                <div className="fact-wizard-pay">

                                    <div className="fact-form-stack">
                                        <div className="vm-form-section-title">
                                            <span className="material-symbols-outlined" aria-hidden="true">payments</span>
                                            Forma de pago
                                        </div>

                                        <div className="form-group">
                                            <label>Método de Pago *</label>
                                            <select
                                                value={
                                                    metodoPago
                                                }
                                                onChange={
                                                    (e) =>
                                                        setMetodoPago(
                                                            e.target.value
                                                        )
                                                }
                                            >
                                                {metodosPagoDisponibles.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Observaciones de Pago</label>
                                            <textarea
                                                rows="4"
                                                value={
                                                    observacionesPago
                                                }
                                                onChange={
                                                    (e) =>
                                                        setObservacionesPago(
                                                            e.target.value
                                                        )
                                                }
                                                placeholder="Observaciones del pago..."
                                            />
                                        </div>
                                    </div>

                                    {/* RESUMEN */}

                                    <div className="fact-summary">
                                        <h4>Resumen Financiero</h4>

                                        <div className="fact-summary-row">
                                            <span>Base Imponible:</span>
                                            <span>{moneda(baseImponible)}</span>
                                        </div>

                                        <div className="fact-summary-row is-danger">
                                            <span>Descuentos:</span>
                                            <span>-{" "}{moneda(totalDescuentos)}</span>
                                        </div>

                                        <div className="fact-summary-row">
                                            <span>IGV 18%:</span>
                                            <span>{moneda(igvMonto)}</span>
                                        </div>

                                        <div className="fact-summary-row is-total">
                                            <span>TOTAL:</span>
                                            <span>{moneda(totalPagar)}</span>
                                        </div>
                                    </div>

                                </div>

                            )}

                        </div>

                        {/* FOOTER */}

                        <div className="modal-footer">

                            {pasoWizard > 1 && (

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() =>
                                        setPasoWizard(
                                            pasoWizard - 1
                                        )
                                    }
                                    disabled={
                                        emitiendoFactura
                                    }
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                                    Anterior
                                </button>

                            )}

                            {pasoWizard < 3 ? (

                                <button
                                    type="button"
                                    className="btn-guardar"
                                    onClick={() => {

                                        if (
                                            pasoWizard === 1 &&
                                            !clienteFactura
                                        ) {

                                            alert(
                                                "Selecciona un cliente."
                                            );

                                            return;
                                        }

                                        if (
                                            pasoWizard === 2 &&
                                            itemsFactura.length === 0
                                        ) {

                                            alert(
                                                "Agrega al menos un ítem."
                                            );

                                            return;
                                        }

                                        setPasoWizard(
                                            pasoWizard + 1
                                        );

                                    }}
                                >
                                    Siguiente
                                    <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                                </button>

                            ) : (

                                <button
                                    type="button"
                                    className="btn-guardar"
                                    onClick={
                                        emitirFacturaFinal
                                    }
                                    disabled={
                                        emitiendoFactura
                                    }
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                                    {
                                        emitiendoFactura
                                            ? "Registrando..."
                                            : `Emitir ${tipoComprobante}`
                                    }
                                </button>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                MODAL NOTA DE CRÉDITO
            ================================================= */}
            {mostrarModalNC && (
                <div className="modal-overlay">
                    <div className="modal-content fact-modal-form">
                        <div className="modal-header">
                            <div>
                                <h2>Emitir Nota de Crédito</h2>
                                <p>Generar comprobante de ajuste o anulación a factura en PostgreSQL</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalNC(false)} aria-label="Cerrar"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
                        </div>

                        <div className="modal-body fact-form-stack">
                            <div className="vm-form-section-title">
                                <span className="material-symbols-outlined" aria-hidden="true">description</span>
                                Comprobante de referencia
                            </div>

                            <div className="form-group">
                                <label>Factura de Referencia *</label>
                                <select
                                    value={ncFacturaId}
                                    onChange={(e) => {
                                        const fId = e.target.value;
                                        setNcFacturaId(fId);
                                        const fac = facturasList.find((f) => String(f.factura_id) === String(fId));
                                        if (fac) {
                                            setNcClienteId(fac.cliente_id);
                                            setNcMontoTotal(fac.total);
                                        }
                                    }}
                                >
                                    <option value="">Seleccionar Factura...</option>
                                    {facturasList.map((f) => (
                                        <option key={f.factura_id} value={f.factura_id}>
                                            {f.numero_comprobante} - Total: S/ {Number(f.total).toFixed(2)} ({f.cliente_nombre || obtenerNombreCliente(f.cliente_id)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tipo de Nota de Crédito *</label>
                                <select
                                    value={ncTipoNota}
                                    onChange={(e) => setNcTipoNota(e.target.value)}
                                >
                                    <option value="Anulación de la operación">Anulación de la operación</option>
                                    <option value="Devolución total">Devolución total</option>
                                    <option value="Devolución parcial">Devolución parcial</option>
                                    <option value="Descuento global">Descuento global</option>
                                    <option value="Corrección por error en la descripción">Corrección por error en la descripción</option>
                                </select>
                            </div>

                            <div className="vm-form-section-title fact-section-gap">
                                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                                Sustento y monto
                            </div>

                            <div className="form-group">
                                <label>Motivo / Sustento de Emisión *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Devolución de repuesto por garantía o descuento..."
                                    value={ncMotivo}
                                    onChange={(e) => setNcMotivo(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Monto Total a Ajustar (S/) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={ncMontoTotal}
                                    onChange={(e) => setNcMontoTotal(e.target.value)}
                                />
                                <small className="fact-hint">
                                    Subtotal (base): S/ {(Number(ncMontoTotal || 0) / 1.18).toFixed(2)} | IGV (18%): S/ {(Number(ncMontoTotal || 0) - (Number(ncMontoTotal || 0) / 1.18)).toFixed(2)}
                                </small>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => setMostrarModalNC(false)}
                                disabled={emitiendoNC}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={emitirNotaCreditoFinal}
                                disabled={emitiendoNC}
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                                {emitiendoNC ? "Emitiendo..." : "Emitir Nota de Crédito"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                MODAL NOTA DE DÉBITO
            ================================================= */}
            {mostrarModalND && (
                <div className="modal-overlay">
                    <div className="modal-content fact-modal-form">
                        <div className="modal-header">
                            <div>
                                <h2>Emitir Nota de Débito</h2>
                                <p>Generar comprobante de ajuste por aumento en el valor del servicio</p>
                            </div>
                            <button
                                className="btn-close"
                                onClick={() => setMostrarModalND(false)}
                                disabled={emitiendoND}
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>

                        <div className="modal-body fact-form-stack">
                            <div className="vm-form-section-title">
                                <span className="material-symbols-outlined" aria-hidden="true">description</span>
                                Comprobante de referencia
                            </div>

                            <div className="form-group">
                                <label>Comprobante de Referencia *</label>
                                <select
                                    value={ndFacturaId}
                                    onChange={(e) => {
                                        const fId = e.target.value;
                                        setNdFacturaId(fId);
                                        const fac = facturasList.find(
                                            (f) => String(f.factura_id) === String(fId)
                                        );
                                        if (fac) {
                                            setNdClienteId(fac.cliente_id);
                                        }
                                    }}
                                >
                                    <option value="">Seleccionar Comprobante...</option>
                                    {facturasList.map((f) => (
                                        <option key={f.factura_id} value={f.factura_id}>
                                            {f.numero_comprobante} - Total: S/ {Number(f.total).toFixed(2)} ({f.cliente_nombre || obtenerNombreCliente(f.cliente_id)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tipo de Nota de Débito *</label>
                                <select
                                    value={ndTipoNota}
                                    onChange={(e) => setNdTipoNota(e.target.value)}
                                >
                                    <option value="Aumento en el valor del servicio">Aumento en el valor del servicio</option>
                                </select>
                            </div>

                            <div className="vm-form-section-title fact-section-gap">
                                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                                Sustento y monto
                            </div>

                            <div className="form-group">
                                <label>Motivo / Sustento de Emisión *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Cargo adicional por servicio..."
                                    value={ndMotivo}
                                    onChange={(e) => setNdMotivo(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Monto Total a Ajustar (S/) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={ndMontoTotal}
                                    onChange={(e) => setNdMontoTotal(e.target.value)}
                                />
                                <small className="fact-hint">
                                    Subtotal (base): S/ {(Number(ndMontoTotal || 0) / 1.18).toFixed(2)} | IGV (18%): S/ {(Number(ndMontoTotal || 0) - (Number(ndMontoTotal || 0) / 1.18)).toFixed(2)}
                                </small>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => setMostrarModalND(false)}
                                disabled={emitiendoND}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={emitirNotaDebitoFinal}
                                disabled={emitiendoND}
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                                {emitiendoND ? "Emitiendo..." : "Emitir Nota de Débito"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                MODAL DE REGISTRO DE PAGO
            ================================================= */}
            {mostrarModalPago && facturaAPagar && (
                <div className="modal-overlay">
                    <div className="modal-content fact-modal-pago">
                        <div className="modal-header">
                            <div>
                                <h2>Registrar Pago de Comprobante</h2>
                                <p>Confirmar cobro y saldar comprobante en PostgreSQL</p>
                            </div>
                            <button
                                className="btn-close"
                                onClick={() => {
                                    setMostrarModalPago(false);
                                    setFacturaAPagar(null);
                                }}
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>

                        <div className="modal-body fact-form-stack">
                            {/* RESUMEN DE LA FACTURA */}
                            <div className="fact-summary">
                                <div className="fact-summary-row">
                                    <span>N° Comprobante:</span>
                                    <span className="vm-code">{facturaAPagar.numero_comprobante}</span>
                                </div>
                                <div className="fact-summary-row">
                                    <span>Cliente:</span>
                                    <strong>
                                        {facturaAPagar.cliente_nombre ||
                                            facturaAPagar.nombre_razon_social ||
                                            obtenerNombreCliente(facturaAPagar.cliente_id)}
                                    </strong>
                                </div>
                                <div className="fact-summary-row">
                                    <span>Tipo:</span>
                                    <span>{facturaAPagar.tipo_comprobante}</span>
                                </div>
                                <div className="fact-summary-row fact-summary-divider">
                                    <span>Total factura:</span>
                                    <strong>
                                        {moneda(facturaAPagar.monto_total)}
                                    </strong>
                                </div>
                                <div className="fact-summary-row">
                                    <span>Pagado</span><strong>{moneda(facturaAPagar.monto_pagado)}</strong>
                                </div>
                                <div className="fact-summary-row is-total">
                                    <span>Saldo pendiente</span><span>{moneda(facturaAPagar.saldo)}</span>
                                </div>
                            </div>

                            {errorModalPago && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{errorModalPago}</div>}
                            {exitoModalPago && <div className="vm-alert vm-alert-success" role="status"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span>{exitoModalPago}</div>}
                            {!cajaAbiertaParaPago && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>No hay una caja abierta. Abre caja antes de registrar el pago.</div>}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Monto a pagar *</label>
                                    <input type="number" min="0.01" max={facturaAPagar.saldo} step="0.01" value={montoPagoRegistro} onChange={(event) => setMontoPagoRegistro(event.target.value)} required disabled={Boolean(exitoModalPago)} />
                                </div>

                                <div className="form-group">
                                    <label>Usuario que registra</label>
                                    <input
                                        type="text"
                                        value={usuarioActual?.nombre || "Usuario autenticado"}
                                        readOnly
                                        disabled
                                    />
                                </div>

                                {/* MÉTODO DE PAGO */}
                                <div className="form-group form-group-full">
                                    <label>Método de Pago Utilizado *</label>
                                    <select
                                        value={metodoPagoRegistro}
                                        onChange={(e) => setMetodoPagoRegistro(e.target.value)}
                                        required
                                    >
                                        {metodosPagoDisponibles.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                                    </select>
                                </div>

                                {/* OBSERVACIONES */}
                                <div className="form-group form-group-full">
                                    <label>N° de Operación / Observaciones de Pago (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Operación #987213 o Pago en caja principal..."
                                        value={observacionesPagoRegistro}
                                        onChange={(e) => setObservacionesPagoRegistro(e.target.value)}
                                        disabled={Boolean(exitoModalPago)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => {
                                    setMostrarModalPago(false);
                                    setFacturaAPagar(null);
                                }}
                                disabled={procesandoPago}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={confirmarPagoFactura}
                                disabled={procesandoPago || !cajaAbiertaParaPago || !montoPagoRegistro || Number(montoPagoRegistro) <= 0 || Number(montoPagoRegistro) > Number(facturaAPagar.saldo) || Boolean(exitoModalPago)}
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">payments</span>
                                {procesandoPago ? "Registrando pago..." : exitoModalPago ? "Pago registrado" : "Confirmar pago"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
}

export default Facturacion;
