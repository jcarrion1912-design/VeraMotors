
import { useEffect, useState } from "react";
import "./Facturacion.css";

const API_URL = "http://127.0.0.1:8000/api";

const SUBMENUS_FACTURACION = [
    "Facturas",
    "Notas de Crédito",
    "Cuentas por Cobrar",
    "Cotizaciones",
    "Remisiones",
    "Cierre de Caja"
];

function Facturacion() {

    const [submodulo, setSubmodulo] = useState("Facturas");

    const [mostrarWizard, setMostrarWizard] = useState(false);
    const [pasoWizard, setPasoWizard] = useState(1);

    // =========================================================
    // DATOS
    // =========================================================

    const [facturasList, setFacturasList] = useState([]);
    const [cotizacionesList, setCotizacionesList] = useState([]);
    const [notasCreditoList, setNotasCreditoList] = useState([]);
    const [remisionesList, setRemisionesList] = useState([]);
    const [cierresCajaList, setCierresCajaList] = useState([]);

    const [clientes, setClientes] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [ordenesServicio, setOrdenesServicio] = useState([]);

    const [cargandoFacturas, setCargandoFacturas] = useState(false);
    const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false);
    const [cargandoNotasCredito, setCargandoNotasCredito] = useState(false);
    const [cargandoRemisiones, setCargandoRemisiones] = useState(false);
    const [cargandoCierresCaja, setCargandoCierresCaja] = useState(false);

    // =========================================================
    // WIZARD
    // =========================================================

    const [clienteFactura, setClienteFactura] = useState("");
    const [vehiculoFactura, setVehiculoFactura] = useState("");
    const [odsSeleccionada, setOdsSeleccionada] = useState("");

    const [tipoComprobante, setTipoComprobante] =
        useState("Factura Electrónica");

    const [metodoPago, setMetodoPago] = useState("Yape");

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

        const totalNum = Number(ncMontoTotal);
        const subtotalNum = Number((totalNum / 1.18).toFixed(2));
        const impuestosNum = Number((totalNum - subtotalNum).toFixed(2));

        try {
            setEmitiendoNC(true);
            const response = await fetch(`${API_URL}/notas-credito`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    factura_id: Number(ncFacturaId),
                    cliente_id: Number(ncClienteId),
                    tipo_nota: ncTipoNota,
                    motivo: ncMotivo.trim(),
                    subtotal: subtotalNum,
                    impuestos: impuestosNum,
                    total: totalNum
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Error al emitir la nota de crédito.");
            }

            alert("Nota de Crédito registrada con éxito en PostgreSQL.");
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
    // CARGAR REMISIONES
    // =========================================================

    const cargarRemisiones = async () => {

        try {

            setCargandoRemisiones(true);

            const response = await fetch(
                `${API_URL}/remisiones`
            );

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    "Error HTTP remisiones:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `Error ${response.status} al cargar remisiones.`
                );
            }

            const data = await response.json();

            console.log(
                "Remisiones recibidas:",
                data
            );

            setRemisionesList(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(
                "Error cargando remisiones:",
                error
            );

            setRemisionesList([]);

            alert(
                "No se pudieron cargar las remisiones."
            );

        } finally {

            setCargandoRemisiones(false);

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

            const payload = {
                cliente_id: Number(cotizacionCliente),
                vehiculo_id: Number(cotizacionVehiculo),
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

        cargarFacturas();
        cargarCotizaciones();
        cargarNotasCredito();
        cargarRemisiones();
        cargarCierresCaja();

        cargarClientes();
        cargarVehiculos();
        cargarOrdenesServicio();

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
        setMetodoPago("Yape");

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
    // VEHÍCULOS DEL CLIENTE
    // =========================================================

    const vehiculosCliente = vehiculos.filter(
        (vehiculo) =>
            String(
                vehiculo.cliente_id
            ) === String(clienteFactura)
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

                            precio_unitario:
                                Number(item.precio_unitario),

                            descuento:
                                Number(
                                    item.descuento || 0
                                ),

                            impuesto:
                                Number(
                                    (
                                        (
                                            Number(item.cantidad) *
                                            Number(item.precio_unitario)
                                        ) -
                                        Number(item.descuento || 0)
                                    ) * 0.18
                                ),

                            total:
                                Number(
                                    (
                                        (
                                            Number(item.cantidad) *
                                            Number(item.precio_unitario)
                                        ) -
                                        Number(item.descuento || 0)
                                    ).toFixed(2)
                                )

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
    // NOMBRE VEHÍCULO
    // =========================================================

    const obtenerVehiculo = (vehiculoId) => {

        const vehiculo = vehiculos.find(
            (item) =>
                String(
                    item.vehiculo_id
                ) === String(vehiculoId)
        );

        if (!vehiculo) {
            return vehiculoId || "-";
        }

        return `${vehiculo.marca || ""} ${vehiculo.modelo || ""
            } ${vehiculo.placa
                ? `(${vehiculo.placa})`
                : ""
            }`;
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="facturacion-page">

            {/* =================================================
                CABECERA
            ================================================= */}

            <div className="facturacion-header">

                <div>

                    <h2>
                        Ingresos y Facturación Electrónica
                    </h2>

                    <p>
                        Gestión comercial, cotizaciones,
                        cobranzas y comprobantes SUNAT
                        de VeraMotors.
                    </p>

                </div>

                <div className="facturacion-header-actions">

                    <button
                        className="btn-nueva-factura"
                        onClick={abrirWizard}
                    >

                        <span className="material-symbols-outlined">
                            receipt_long
                        </span>

                        + Nueva Factura

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
                            className={
                                `fact-tab-btn ${submodulo === sub
                                    ? "active"
                                    : ""
                                }`
                            }
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

                <div
                    className="os-table-wrapper"
                    style={{
                        marginTop: "16px"
                    }}
                >

                    <table className="os-table">

                        <thead>

                            <tr>

                                <th>N° Factura</th>

                                <th>Fecha Emisión</th>

                                <th>Cliente</th>

                                <th>Tipo</th>

                                <th>Subtotal</th>

                                <th>IGV</th>

                                <th>Total</th>

                                <th>Estado Pago</th>

                                <th>Estado SUNAT</th>

                                <th>Acciones</th>

                            </tr>

                        </thead>

                        <tbody>

                            {cargandoFacturas ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px"
                                        }}
                                    >
                                        Cargando facturas...
                                    </td>

                                </tr>

                            ) : facturasList.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px"
                                        }}
                                    >
                                        No existen facturas
                                        registradas.
                                    </td>

                                </tr>

                            ) : (

                                facturasList.map(
                                    (factura) => (

                                        <tr
                                            key={
                                                factura.factura_id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        factura.numero_comprobante
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {fecha(
                                                    factura.fecha_emision
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    factura.cliente_nombre ||
                                                    factura.nombre_razon_social ||
                                                    obtenerNombreCliente(
                                                        factura.cliente_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    factura.tipo_comprobante
                                                }
                                            </td>

                                            <td>
                                                {moneda(
                                                    factura.subtotal
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    factura.impuestos
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    {moneda(
                                                        factura.total
                                                    )}
                                                </strong>
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${factura.estado_pago ===
                                                            "Pagado"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        factura.estado_pago ||
                                                        "Pendiente"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${factura.estado_sunat ===
                                                            "Aceptado"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        factura.estado_sunat ||
                                                        "Pendiente"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="table-actions">

                                                    <button
                                                        className="btn-act-table link"
                                                        type="button"
                                                        onClick={() =>
                                                            alert(
                                                                "La generación del PDF se conectará al módulo de documentos."
                                                            )
                                                        }
                                                    >
                                                        🖨️ PDF
                                                    </button>

                                                    <button
                                                        className="btn-act-table diag"
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalNC(factura)
                                                        }
                                                        title="Emitir Nota de Crédito por anulación, devolución o descuento"
                                                    >
                                                        📝 Nota Crédito
                                                    </button>

                                                    <button
                                                        className="btn-act-table nps"
                                                        type="button"
                                                        onClick={() =>
                                                            alert(
                                                                "El envío por correo se conectará posteriormente."
                                                            )
                                                        }
                                                    >
                                                        ✉️ Mail
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

                <div
                    className="os-table-wrapper"
                    style={{
                        marginTop: "16px"
                    }}
                >

                    <div
                        style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >

                        <div>

                            <h3>
                                Notas de Crédito
                            </h3>

                            <p
                                style={{
                                    margin: "4px 0",
                                    color: "#64748b"
                                }}
                            >
                                Notas de crédito registradas
                                en PostgreSQL.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn-act-table link"
                            style={{ padding: "8px 16px" }}
                            onClick={() => abrirModalNC()}
                        >
                            + Nueva Nota de Crédito
                        </button>

                    </div>

                    <table className="os-table">

                        <thead>

                            <tr>

                                <th>N° Nota</th>

                                <th>Fecha</th>

                                <th>Factura</th>

                                <th>Cliente</th>

                                <th>Tipo</th>

                                <th>Motivo</th>

                                <th>Subtotal</th>

                                <th>IGV</th>

                                <th>Total</th>

                                <th>Estado SUNAT</th>

                            </tr>

                        </thead>

                        <tbody>

                            {cargandoNotasCredito ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Cargando notas de crédito...
                                    </td>

                                </tr>

                            ) : notasCreditoList.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No existen notas de crédito
                                        registradas.
                                    </td>

                                </tr>

                            ) : (

                                notasCreditoList.map(
                                    (nota) => (

                                        <tr
                                            key={
                                                nota.nota_credito_id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        nota.numero_nota
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {fecha(
                                                    nota.fecha_emision
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    nota.factura_id
                                                }
                                            </td>

                                            <td>
                                                {
                                                    nota.cliente_nombre ||
                                                    nota.nombre_razon_social ||
                                                    obtenerNombreCliente(
                                                        nota.cliente_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    nota.tipo_nota
                                                }
                                            </td>

                                            <td>
                                                {
                                                    nota.motivo
                                                }
                                            </td>

                                            <td>
                                                {moneda(
                                                    nota.subtotal
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    nota.impuestos
                                                )}
                                            </td>

                                            <td>

                                                <strong>
                                                    {moneda(
                                                        nota.total
                                                    )}
                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${nota.estado_sunat ===
                                                            "Aceptado"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        nota.estado_sunat ||
                                                        "Pendiente"
                                                    }
                                                </span>

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
                CUENTAS POR COBRAR
            ================================================= */}

            {submodulo === "Cuentas por Cobrar" && (

                <div
                    style={{
                        background: "#ffffff",
                        padding: "40px",
                        textAlign: "center",
                        borderRadius: "8px",
                        marginTop: "16px",
                        color: "#64748b",
                        border: "1px solid #e2e8f0"
                    }}
                >

                    <h3>
                        Cuentas por Cobrar
                    </h3>

                    <p>
                        Este submódulo se conectará
                        posteriormente con PostgreSQL.
                    </p>

                </div>

            )}

            {/* =================================================
                COTIZACIONES
            ================================================= */}

            {submodulo === "Cotizaciones" && (

                <div
                    className="os-table-wrapper"
                    style={{
                        marginTop: "16px"
                    }}
                >

                    <div
                        style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >

                        <h3>
                            Lista de Cotizaciones
                        </h3>

                        <button
                            className="btn-act-table link"
                            style={{
                                padding: "8px 16px"
                            }}
                            type="button"
                            onClick={abrirModalCotizacion}
                        >
                            + Nueva Cotización
                        </button>

                    </div>

                    {mostrarModalCotizacion && (
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "20px",
                                margin: "0 0 18px 0"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "16px"
                                }}
                            >
                                <h3 style={{ margin: 0 }}>Registrar cotización</h3>
                                <button
                                    type="button"
                                    className="btn-act-table nps"
                                    onClick={cerrarModalCotizacion}
                                >
                                    Cerrar
                                </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Cliente</label>
                                    <select
                                        value={cotizacionCliente}
                                        onChange={(e) => {
                                            setCotizacionCliente(e.target.value);
                                            setCotizacionVehiculo("");
                                        }}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="">Seleccione un cliente</option>
                                        {clientes.map((cliente) => (
                                            <option key={cliente.cliente_id ?? cliente.id} value={cliente.cliente_id ?? cliente.id}>
                                                {cliente.nombre_razon_social || cliente.nombre || cliente.razon_social || `Cliente ${cliente.cliente_id ?? cliente.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Vehículo</label>
                                    <select
                                        value={cotizacionVehiculo}
                                        onChange={(e) => setCotizacionVehiculo(e.target.value)}
                                        disabled={!cotizacionCliente}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="">Seleccione un vehículo</option>
                                        {vehiculosClienteCotizacion.map((vehiculo) => (
                                            <option key={vehiculo.vehiculo_id} value={vehiculo.vehiculo_id}>
                                                {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: "18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                                <h4 style={{ margin: "0 0 12px" }}>Items de cotización</h4>

                                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.7fr auto", gap: "10px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Descripción</label>
                                        <input
                                            type="text"
                                            value={nuevoItemCotizacionDesc}
                                            onChange={(e) => setNuevoItemCotizacionDesc(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Precio</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={nuevoItemCotizacionPrecio}
                                            onChange={(e) => setNuevoItemCotizacionPrecio(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={nuevoItemCotizacionCantidad}
                                            onChange={(e) => setNuevoItemCotizacionCantidad(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Desc.</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={nuevoItemCotizacionDescuento}
                                            onChange={(e) => setNuevoItemCotizacionDescuento(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-act-table link"
                                        onClick={agregarItemCotizacion}
                                    >
                                        Agregar
                                    </button>
                                </div>

                                <div style={{ marginTop: "14px" }}>
                                    {itemsCotizacion.length === 0 ? (
                                        <div style={{ color: "#64748b", padding: "8px 0" }}>Todavía no hay items agregados.</div>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: "left", padding: "8px 6px" }}>Descripción</th>
                                                    <th style={{ textAlign: "right", padding: "8px 6px" }}>Cant.</th>
                                                    <th style={{ textAlign: "right", padding: "8px 6px" }}>P. Unit</th>
                                                    <th style={{ textAlign: "right", padding: "8px 6px" }}>Desc.</th>
                                                    <th style={{ textAlign: "right", padding: "8px 6px" }}>Total</th>
                                                    <th style={{ textAlign: "center", padding: "8px 6px" }}>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemsCotizacion.map((item) => {
                                                    const subtotal = Number(item.cantidad) * Number(item.precio_unitario);
                                                    const totalItem = subtotal - Number(item.descuento || 0);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td style={{ padding: "8px 6px" }}>{item.descripcion}</td>
                                                            <td style={{ textAlign: "right", padding: "8px 6px" }}>{item.cantidad}</td>
                                                            <td style={{ textAlign: "right", padding: "8px 6px" }}>{moneda(item.precio_unitario)}</td>
                                                            <td style={{ textAlign: "right", padding: "8px 6px" }}>{moneda(item.descuento || 0)}</td>
                                                            <td style={{ textAlign: "right", padding: "8px 6px" }}>{moneda(totalItem)}</td>
                                                            <td style={{ textAlign: "center", padding: "8px 6px" }}>
                                                                <button type="button" className="btn-act-table diag" onClick={() => eliminarItemCotizacion(item.id)}>
                                                                    Quitar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
                                <strong>Total cotización: {moneda(totalCotizacion)}</strong>
                                <button
                                    type="button"
                                    className="btn-act-table link"
                                    onClick={guardarCotizacion}
                                    disabled={guardandoCotizacion}
                                    style={{ opacity: guardandoCotizacion ? 0.7 : 1 }}
                                >
                                    {guardandoCotizacion ? "Guardando..." : "Guardar Cotización"}
                                </button>
                            </div>
                        </div>
                    )}

                    <table className="os-table">

                        <thead>

                            <tr>

                                <th>ID Cotización</th>

                                <th>Fecha</th>

                                <th>Cliente</th>

                                <th>Total</th>

                                <th>Estado</th>

                                <th>Acciones</th>

                            </tr>

                        </thead>

                        <tbody>

                            {cargandoCotizaciones ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px"
                                        }}
                                    >
                                        Cargando cotizaciones...
                                    </td>

                                </tr>

                            ) : cotizacionesList.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px"
                                        }}
                                    >
                                        No existen cotizaciones.
                                    </td>

                                </tr>

                            ) : (

                                cotizacionesList.map(
                                    (cotizacion) => (

                                        <tr
                                            key={
                                                cotizacion.cotizacion_id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        cotizacion.codigo_cotizacion
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {fecha(
                                                    cotizacion.fecha
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    cotizacion.cliente_nombre ||
                                                    cotizacion.nombre_razon_social ||
                                                    obtenerNombreCliente(
                                                        cotizacion.cliente_id
                                                    )
                                                }
                                            </td>

                                            <td>

                                                <strong>
                                                    {moneda(
                                                        cotizacion.total
                                                    )}
                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${cotizacion.estado ===
                                                            "Aprobada"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        cotizacion.estado
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <button
                                                    className="btn-act-table nps"
                                                    type="button"
                                                    onClick={() => {

                                                        setClienteFactura(
                                                            cotizacion.cliente_id
                                                        );

                                                        setMostrarWizard(
                                                            true
                                                        );

                                                        setPasoWizard(
                                                            1
                                                        );

                                                    }}
                                                >
                                                    Facturar
                                                </button>

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
                REMISIONES
            ================================================= */}

            {submodulo === "Remisiones" && (

                <div
                    className="os-table-wrapper"
                    style={{
                        marginTop: "16px"
                    }}
                >

                    <div
                        style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >

                        <div>

                            <h3>
                                Remisiones
                            </h3>

                            <p
                                style={{
                                    margin: "4px 0",
                                    color: "#64748b"
                                }}
                            >
                                Guías de remisión registradas
                                en PostgreSQL.
                            </p>

                        </div>

                    </div>

                    <table className="os-table">

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

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Cargando remisiones...
                                    </td>

                                </tr>

                            ) : remisionesList.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No existen remisiones
                                        registradas.
                                    </td>

                                </tr>

                            ) : (

                                remisionesList.map(
                                    (remision) => (

                                        <tr
                                            key={
                                                remision.remision_id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        remision.numero_remision
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {fecha(
                                                    remision.fecha_emision
                                                )}
                                            </td>

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

                                            <td>
                                                {
                                                    remision.ods_id ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    remision.motivo_traslado
                                                }
                                            </td>

                                            <td>
                                                {
                                                    remision.punto_partida ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    remision.punto_llegada ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${remision.estado ===
                                                            "Emitida" ||
                                                            remision.estado ===
                                                            "Aceptada"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        remision.estado ||
                                                        "Pendiente"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${remision.estado_sunat ===
                                                            "Aceptado"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        remision.estado_sunat ||
                                                        "Pendiente"
                                                    }
                                                </span>

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
                CIERRE DE CAJA
            ================================================= */}

            {submodulo === "Cierre de Caja" && (

                <div
                    className="os-table-wrapper"
                    style={{
                        marginTop: "16px"
                    }}
                >

                    <div
                        style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >

                        <div>

                            <h3>
                                Cierre de Caja
                            </h3>

                            <p
                                style={{
                                    margin: "4px 0",
                                    color: "#64748b"
                                }}
                            >
                                Historial de cierres de caja
                                registrados en PostgreSQL.
                            </p>

                        </div>

                    </div>

                    <table className="os-table">

                        <thead>

                            <tr>

                                <th>ID</th>

                                <th>Apertura</th>

                                <th>Cierre</th>

                                <th>Usuario</th>

                                <th>Monto Inicial</th>

                                <th>Efectivo</th>

                                <th>Yape</th>

                                <th>Plin</th>

                                <th>Tarjeta</th>

                                <th>Transferencia</th>

                                <th>Total Ventas</th>

                                <th>Esperado</th>

                                <th>Real</th>

                                <th>Diferencia</th>

                                <th>Estado</th>

                            </tr>

                        </thead>

                        <tbody>

                            {cargandoCierresCaja ? (

                                <tr>

                                    <td
                                        colSpan="15"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        Cargando cierres de caja...
                                    </td>

                                </tr>

                            ) : cierresCajaList.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="15"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px"
                                        }}
                                    >
                                        No existen cierres de caja
                                        registrados.
                                    </td>

                                </tr>

                            ) : (

                                cierresCajaList.map(
                                    (cierre) => (

                                        <tr
                                            key={
                                                cierre.cierre_caja_id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        cierre.cierre_caja_id
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {fecha(
                                                    cierre.fecha_apertura
                                                )}
                                            </td>

                                            <td>
                                                {fecha(
                                                    cierre.fecha_cierre
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    cierre.usuario_nombre ||
                                                    cierre.usuario_id
                                                }
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.monto_inicial
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_efectivo
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_yape
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_plin
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_tarjeta
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_transferencia
                                                )}
                                            </td>

                                            <td>

                                                <strong>
                                                    {moneda(
                                                        cierre.total_ventas
                                                    )}
                                                </strong>

                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.total_esperado
                                                )}
                                            </td>

                                            <td>
                                                {moneda(
                                                    cierre.monto_real
                                                )}
                                            </td>

                                            <td>

                                                <strong>
                                                    {moneda(
                                                        cierre.diferencia
                                                    )}
                                                </strong>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `proc-tag ${cierre.estado ===
                                                            "Cerrada"
                                                            ? "preventivo"
                                                            : "correctivo"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        cierre.estado ||
                                                        "Pendiente"
                                                    }
                                                </span>

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
                WIZARD
            ================================================= */}

            {mostrarWizard && (

                <div className="modal-overlay">

                    <div
                        className="modal-content wizard-modal"
                        style={{
                            maxWidth: "850px"
                        }}
                    >

                        {/* HEADER */}

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Wizard de Emisión
                                    de Factura
                                    Electrónica
                                </h2>

                                <p>

                                    Paso{" "}
                                    {pasoWizard}
                                    {" "}de 3 -

                                    {" "}

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
                            >
                                ✕
                            </button>

                        </div>

                        {/* PASOS */}

                        <div
                            className="wizard-steps-bar"
                            style={{
                                display: "flex",
                                background: "#f1f5f9",
                                borderBottom:
                                    "1px solid #e2e8f0"
                            }}
                        >

                            <div
                                className={
                                    `step-item ${pasoWizard === 1
                                        ? "active"
                                        : ""
                                    }`
                                }
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    fontWeight: "bold"
                                }}
                            >
                                1. Cliente / ODS
                            </div>

                            <div
                                className={
                                    `step-item ${pasoWizard === 2
                                        ? "active"
                                        : ""
                                    }`
                                }
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    fontWeight: "bold"
                                }}
                            >
                                2. Ítems
                            </div>

                            <div
                                className={
                                    `step-item ${pasoWizard === 3
                                        ? "active"
                                        : ""
                                    }`
                                }
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    fontWeight: "bold"
                                }}
                            >
                                3. Pago & Emisión
                            </div>

                        </div>

                        {/* BODY */}

                        <div className="modal-body">

                            {/* PASO 1 */}

                            {pasoWizard === 1 && (

                                <div>

                                    <div
                                        className="form-group"
                                        style={{
                                            marginBottom:
                                                "14px"
                                        }}
                                    >

                                        <label>
                                            Tipo de
                                            Comprobante *
                                        </label>

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

                                            <option>
                                                Factura Electrónica
                                            </option>

                                            <option>
                                                Boleta Electrónica
                                            </option>

                                        </select>

                                    </div>

                                    <div
                                        className="form-group"
                                        style={{
                                            marginBottom:
                                                "14px"
                                        }}
                                    >

                                        <label>
                                            Seleccionar
                                            Cliente *
                                        </label>

                                        <select
                                            value={
                                                clienteFactura
                                            }
                                            onChange={
                                                (e) => {

                                                    setClienteFactura(
                                                        e.target.value
                                                    );

                                                    setVehiculoFactura(
                                                        ""
                                                    );

                                                }
                                            }
                                        >

                                            <option value="">
                                                Seleccionar
                                                cliente...
                                            </option>

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

                                                        {
                                                            cliente.nombre_razon_social
                                                        }

                                                        {" - "}

                                                        {
                                                            cliente.documento_identidad
                                                        }

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div
                                        className="form-group"
                                        style={{
                                            marginBottom:
                                                "14px"
                                        }}
                                    >

                                        <label>
                                            Vehículo /
                                            Placa
                                        </label>

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

                                            <option value="">
                                                Seleccionar
                                                vehículo...
                                            </option>

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

                                                        {
                                                            vehiculo.marca
                                                        }

                                                        {" "}

                                                        {
                                                            vehiculo.modelo
                                                        }

                                                        {" ("}

                                                        {
                                                            vehiculo.placa
                                                        }

                                                        {")"}

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Orden de
                                            Servicio
                                            (ODS)
                                        </label>

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

                                            <option value="">
                                                Sin ODS
                                            </option>

                                            {ordenesServicio.map(
                                                (ods) => (

                                                    <option
                                                        key={
                                                            ods.ods_id
                                                        }
                                                        value={
                                                            ods.ods_id
                                                        }
                                                    >

                                                        {
                                                            ods.codigo_ods
                                                        }

                                                        {" - "}

                                                        {
                                                            ods.estado_actual
                                                        }

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                            )}

                            {/* PASO 2 */}

                            {pasoWizard === 2 && (

                                <div>

                                    <h4
                                        style={{
                                            color:
                                                "#0f172a"
                                        }}
                                    >
                                        Detalle de Ítems
                                        a Facturar
                                    </h4>

                                    <table
                                        className="os-table"
                                        style={{
                                            marginTop:
                                                "10px",
                                            marginBottom:
                                                "15px"
                                        }}
                                    >

                                        <thead>

                                            <tr>

                                                <th>
                                                    Descripción
                                                </th>

                                                <th>
                                                    Cant.
                                                </th>

                                                <th>
                                                    Precio
                                                </th>

                                                <th>
                                                    Desc.
                                                </th>

                                                <th>
                                                    Total
                                                </th>

                                                <th>
                                                    Acción
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {itemsFactura.length === 0 ? (

                                                <tr>

                                                    <td
                                                        colSpan="6"
                                                        style={{
                                                            textAlign:
                                                                "center",
                                                            padding:
                                                                "20px"
                                                        }}
                                                    >
                                                        No hay
                                                        ítems
                                                        agregados.
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

                                                            <tr
                                                                key={
                                                                    item.id
                                                                }
                                                            >

                                                                <td>
                                                                    {
                                                                        item.descripcion
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        item.cantidad
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {moneda(
                                                                        item.precio_unitario
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {moneda(
                                                                        item.descuento
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    <strong>
                                                                        {moneda(
                                                                            totalItem
                                                                        )}
                                                                    </strong>
                                                                </td>

                                                                <td>

                                                                    <button
                                                                        type="button"
                                                                        className="btn-act-table diag"
                                                                        onClick={() =>
                                                                            eliminarItem(
                                                                                item.id
                                                                            )
                                                                        }
                                                                    >
                                                                        🗑️
                                                                    </button>

                                                                </td>

                                                            </tr>

                                                        );

                                                    }
                                                )

                                            )}

                                        </tbody>

                                    </table>

                                    {/* AGREGAR ITEM */}

                                    <div
                                        style={{
                                            background:
                                                "#f8fafc",
                                            padding:
                                                "12px",
                                            borderRadius:
                                                "6px",
                                            border:
                                                "1px solid #e2e8f0",
                                            display:
                                                "flex",
                                            gap:
                                                "8px",
                                            flexWrap:
                                                "wrap"
                                        }}
                                    >

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
                                            style={{
                                                flex:
                                                    "2 1 250px"
                                            }}
                                        />

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
                                            style={{
                                                flex:
                                                    "1 1 100px"
                                            }}
                                        />

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
                                            style={{
                                                flex:
                                                    "1 1 120px"
                                            }}
                                        />

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
                                            style={{
                                                flex:
                                                    "1 1 120px"
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="btn-act-table link"
                                            onClick={
                                                agregarItemManual
                                            }
                                        >
                                            + Añadir
                                        </button>

                                    </div>

                                </div>

                            )}

                            {/* PASO 3 */}

                            {pasoWizard === 3 && (

                                <div>

                                    <div
                                        style={{
                                            display:
                                                "grid",
                                            gridTemplateColumns:
                                                "1fr 1fr",
                                            gap:
                                                "20px"
                                        }}
                                    >

                                        <div>

                                            <div
                                                className="form-group"
                                                style={{
                                                    marginBottom:
                                                        "12px"
                                                }}
                                            >

                                                <label>
                                                    Método
                                                    de Pago *
                                                </label>

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

                                                    <option>
                                                        Efectivo
                                                    </option>

                                                    <option>
                                                        Yape
                                                    </option>

                                                    <option>
                                                        Plin
                                                    </option>

                                                    <option>
                                                        Tarjeta
                                                    </option>

                                                    <option>
                                                        Transferencia
                                                    </option>

                                                    <option>
                                                        Otro
                                                    </option>

                                                </select>

                                            </div>

                                            <div className="form-group">

                                                <label>
                                                    Observaciones
                                                    de Pago
                                                </label>

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

                                        <div
                                            style={{
                                                background:
                                                    "#f8fafc",
                                                padding:
                                                    "16px",
                                                borderRadius:
                                                    "8px",
                                                border:
                                                    "1px solid #cbd5e1",
                                                color:
                                                    "#0f172a"
                                            }}
                                        >

                                            <h4
                                                style={{
                                                    margin:
                                                        "0 0 10px 0",
                                                    borderBottom:
                                                        "1px solid #cbd5e1",
                                                    paddingBottom:
                                                        "6px"
                                                }}
                                            >
                                                Resumen
                                                Financiero
                                            </h4>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    fontSize:
                                                        "0.85rem",
                                                    margin:
                                                        "4px 0"
                                                }}
                                            >

                                                <span>
                                                    Base Imponible:
                                                </span>

                                                <span>
                                                    {moneda(
                                                        baseImponible
                                                    )}
                                                </span>

                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    fontSize:
                                                        "0.85rem",
                                                    margin:
                                                        "4px 0",
                                                    color:
                                                        "#dc2626"
                                                }}
                                            >

                                                <span>
                                                    Descuentos:
                                                </span>

                                                <span>
                                                    -
                                                    {" "}
                                                    {moneda(
                                                        totalDescuentos
                                                    )}
                                                </span>

                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    fontSize:
                                                        "0.85rem",
                                                    margin:
                                                        "4px 0",
                                                    color:
                                                        "#2563eb"
                                                }}
                                            >

                                                <span>
                                                    IGV 18%:
                                                </span>

                                                <span>
                                                    {moneda(
                                                        igvMonto
                                                    )}
                                                </span>

                                            </div>

                                            <hr
                                                style={{
                                                    borderColor:
                                                        "#cbd5e1",
                                                    margin:
                                                        "10px 0"
                                                }}
                                            />

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    fontSize:
                                                        "1.1rem",
                                                    fontWeight:
                                                        "bold",
                                                    color:
                                                        "#16a34a"
                                                }}
                                            >

                                                <span>
                                                    TOTAL:
                                                </span>

                                                <span>
                                                    {moneda(
                                                        totalPagar
                                                    )}
                                                </span>

                                            </div>

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
                                    ◀ Anterior
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
                                    Siguiente ▶
                                </button>

                            ) : (

                                <button
                                    type="button"
                                    className="btn-approve"
                                    onClick={
                                        emitirFacturaFinal
                                    }
                                    disabled={
                                        emitiendoFactura
                                    }
                                >

                                    {
                                        emitiendoFactura
                                            ? "Registrando..."
                                            : "🧾 Emitir Factura Electrónica"
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
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <div>
                                <h2>Emitir Nota de Crédito</h2>
                                <p>Generar comprobante de ajuste o anulación a factura en PostgreSQL</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalNC(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group" style={{ marginBottom: "14px" }}>
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

                            <div className="form-group" style={{ marginBottom: "14px" }}>
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

                            <div className="form-group" style={{ marginBottom: "14px" }}>
                                <label>Motivo / Sustento de Emisión *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Devolución de repuesto por garantía o descuento..."
                                    value={ncMotivo}
                                    onChange={(e) => setNcMotivo(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "14px" }}>
                                <label>Monto Total a Ajustar (S/) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={ncMontoTotal}
                                    onChange={(e) => setNcMontoTotal(e.target.value)}
                                />
                                <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
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
                                className="btn-approve"
                                onClick={emitirNotaCreditoFinal}
                                disabled={emitiendoNC}
                            >
                                {emitiendoNC ? "Emitiendo..." : "📝 Emitir Nota de Crédito"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
}

export default Facturacion;

