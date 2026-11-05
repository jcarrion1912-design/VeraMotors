import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
    adjuntarPdfOriginalProveedor,
    crearFacturaProveedor,
    obtenerFacturasProveedor,
    obtenerPagosProveedor,
    registrarPagoProveedor,
    urlPdfProveedor
} from "../../services/comprasService";

const ESTADOS_FACTURA = ["Pendiente", "Parcialmente pagada", "Pagada"];
const METODOS_PAGO = ["Transferencia", "Efectivo", "Yape/Plin", "Cheque", "Tarjeta"];
const MONEDAS = ["PEN", "USD"];

const hoyISO = () => {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
};

const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;
const moneda = (valor, codigo = "PEN") =>
    Number(valor || 0).toLocaleString("es-PE", {
        style: "currency",
        currency: codigo === "USD" ? "USD" : "PEN"
    });
const fechaCorta = (valor) => (valor ? new Date(valor).toLocaleDateString() : "—");

const claseEstado = (estado) => {
    if (estado === "Pagada") return "vm-badge-success";
    if (estado === "Parcialmente pagada") return "vm-badge-warning";
    return "vm-badge-info";
};

const facturaVacia = (proveedorId = "") => ({
    proveedor_id: proveedorId,
    compra_id: "",
    recepcion_id: "",
    tipo_comprobante: "Factura",
    serie: "",
    numero: "",
    fecha_emision: hoyISO(),
    fecha_vencimiento: "",
    moneda: "PEN",
    estado: "Pendiente",
    observaciones: "",
    detalles: [{ descripcion: "", cantidad: "1", precio_unitario: "", impuesto: "0" }]
});

function FacturasProveedor({ proveedores, ordenesCompra, recepciones, usuarioActual }) {
    const [facturas, setFacturas] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");

    const [nuevaFactura, setNuevaFactura] = useState(null);
    const [facturaExpandidaId, setFacturaExpandidaId] = useState(null);
    const [facturaAPagar, setFacturaAPagar] = useState(null);
    const [pago, setPago] = useState({ monto: "", metodo_pago: METODOS_PAGO[0], observaciones: "" });
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");
    const [detalleModificado, setDetalleModificado] = useState(false);
    const [pdfSubiendoFacturaId, setPdfSubiendoFacturaId] = useState(null);
    const [aviso, setAviso] = useState("");

    const cargar = useCallback(async () => {
        try {
            const [facturasData, pagosData] = await Promise.all([
                obtenerFacturasProveedor(),
                obtenerPagosProveedor()
            ]);
            setFacturas(facturasData);
            setPagos(pagosData);
            setErrorCarga("");
        } catch (error) {
            console.error("Error cargando facturas de proveedor:", error);
            setErrorCarga(error.message || "No se pudieron cargar las facturas de proveedor.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let activa = true;
        queueMicrotask(() => { if (activa) cargar(); });
        return () => { activa = false; };
    }, [cargar]);

    const nombreProveedor = (id) =>
        proveedores.find((p) => Number(p.proveedor_id) === Number(id))?.razon_social || "Proveedor no encontrado";

    const codigoOrden = (id) =>
        ordenesCompra.find((o) => Number(o.compra_id) === Number(id))?.codigo_compra;

    const pagadoPorFactura = useMemo(() => {
        const acumulado = {};
        pagos.forEach((p) => {
            acumulado[p.factura_proveedor_id] = (acumulado[p.factura_proveedor_id] || 0) + Number(p.monto);
        });
        return acumulado;
    }, [pagos]);

    const saldoDe = (factura) =>
        redondear(Number(factura.total) - (pagadoPorFactura[factura.factura_proveedor_id] || 0));

    const facturasFiltradas = facturas.filter((f) => estadoFiltro === "Todos" || f.estado === estadoFiltro);
    const saldoPorMoneda = facturas.reduce(
        (saldos, factura) => {
            const monedaFactura = factura.moneda === "USD" ? "USD" : "PEN";
            saldos[monedaFactura] += saldoDe(factura);
            return saldos;
        },
        { PEN: 0, USD: 0 }
    );
    const hoy = hoyISO();

    // ---------- Registrar factura ----------
    const abrirNuevaFactura = () => {
        setErrorModal("");
        setAviso("");
        setDetalleModificado(false);
        setNuevaFactura(facturaVacia(String(proveedores[0]?.proveedor_id || "")));
    };

    const cambiarFactura = (campo, valor) => {
        setNuevaFactura((actual) => {
            return { ...actual, [campo]: valor };
        });
    };

    const seleccionarProveedor = (valor) => {
        if (valor === nuevaFactura.proveedor_id) return;
        if (nuevaFactura.compra_id &&
            !window.confirm("Al cambiar el proveedor se quitarán la compra seleccionada y las líneas cargadas desde ella. ¿Continuar?")) {
            return;
        }
        setNuevaFactura((actual) => ({
            ...actual,
            proveedor_id: valor,
            compra_id: "",
            recepcion_id: "",
            detalles: actual.compra_id
                ? [{ descripcion: "", cantidad: "1", precio_unitario: "", impuesto: "0" }]
                : actual.detalles
        }));
        if (nuevaFactura.compra_id) setDetalleModificado(false);
    };

    const seleccionarCompra = (valor) => {
        if (valor !== nuevaFactura.compra_id && detalleModificado &&
            !window.confirm("Las líneas fueron modificadas manualmente. ¿Reemplazarlas por los productos de la compra seleccionada?")) {
            return;
        }

        const orden = ordenesCompra.find((item) => String(item.compra_id) === valor);
        const detalles = (orden?.detalles || []).map((detalle) => {
            const codigo = detalle.codigo_referencia || detalle.item?.codigo_referencia;
            const descripcion = detalle.descripcion || detalle.item?.nombre_nomenclatura || `Artículo ${detalle.item_id}`;
            return {
                descripcion: codigo ? `${codigo} - ${descripcion}` : descripcion,
                cantidad: String(detalle.cantidad),
                precio_unitario: String(detalle.precio_unitario),
                impuesto: String(detalle.impuesto || 0)
            };
        });

        setNuevaFactura((actual) => ({
            ...actual,
            compra_id: valor,
            recepcion_id: actual.recepcion_id &&
                String(recepciones.find((item) => String(item.recepcion_id) === actual.recepcion_id)?.compra_id) !== valor
                ? ""
                : actual.recepcion_id,
            detalles: detalles.length
                ? detalles
                : [{ descripcion: "", cantidad: "1", precio_unitario: "", impuesto: "0" }]
        }));
        setDetalleModificado(false);
    };

    const cambiarDetalle = (indice, campo, valor) => {
        setDetalleModificado(true);
        setNuevaFactura((actual) => ({
            ...actual,
            detalles: actual.detalles.map((detalle, posicion) =>
                posicion === indice ? { ...detalle, [campo]: valor } : detalle
            )
        }));
    };

    const agregarDetalle = () => {
        setDetalleModificado(true);
        setNuevaFactura((actual) => ({
            ...actual,
            detalles: [
                ...actual.detalles,
                { descripcion: "", cantidad: "1", precio_unitario: "", impuesto: "0" }
            ]
        }));
    };

    const quitarDetalle = (indice) => {
        setDetalleModificado(true);
        setNuevaFactura((actual) => ({
            ...actual,
            detalles: actual.detalles.filter((_, posicion) => posicion !== indice)
        }));
    };

    const importesFactura = useMemo(() => {
        const subtotal = (nuevaFactura?.detalles || []).reduce(
            (suma, detalle) =>
                suma + redondear(
                    Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)
                ),
            0
        );
        const igv = (nuevaFactura?.detalles || []).reduce(
            (suma, detalle) => suma + redondear(Number(detalle.impuesto || 0)),
            0
        );
        return {
            subtotal: redondear(subtotal),
            igv: redondear(igv),
            total: redondear(subtotal + igv)
        };
    }, [nuevaFactura?.detalles]);
    const totalNuevaFactura = importesFactura.total;

    const guardarFactura = async (e) => {
        e.preventDefault();
        if (!nuevaFactura.detalles.length) {
            setErrorModal("Agrega al menos una línea al detalle de la factura.");
            return;
        }
        if (nuevaFactura.detalles.some((detalle) =>
            !detalle.descripcion.trim() ||
            Number(detalle.cantidad) <= 0 ||
            Number(detalle.precio_unitario) < 0 ||
            Number(detalle.impuesto) < 0
        )) {
            setErrorModal("Completa cada detalle con descripción, cantidad, precio e impuesto válidos.");
            return;
        }
        if (totalNuevaFactura <= 0) {
            setErrorModal("El total del comprobante debe ser mayor a cero.");
            return;
        }
        if (nuevaFactura.fecha_vencimiento && nuevaFactura.fecha_vencimiento < nuevaFactura.fecha_emision) {
            setErrorModal("El vencimiento no puede ser anterior a la emisión.");
            return;
        }
        setGuardando(true);
        setErrorModal("");
        try {
            await crearFacturaProveedor({
                proveedor_id: Number(nuevaFactura.proveedor_id),
                compra_id: nuevaFactura.compra_id ? Number(nuevaFactura.compra_id) : null,
                recepcion_id: nuevaFactura.recepcion_id ? Number(nuevaFactura.recepcion_id) : null,
                tipo_comprobante: "Factura",
                serie: nuevaFactura.serie.trim().toUpperCase(),
                numero: nuevaFactura.numero.trim(),
                fecha_emision: `${nuevaFactura.fecha_emision}T00:00:00`,
                fecha_vencimiento: nuevaFactura.fecha_vencimiento ? `${nuevaFactura.fecha_vencimiento}T00:00:00` : null,
                subtotal: importesFactura.subtotal,
                igv: importesFactura.igv,
                total: totalNuevaFactura,
                moneda: nuevaFactura.moneda,
                estado: "Pendiente",
                observaciones: nuevaFactura.observaciones.trim() || null,
                detalles: nuevaFactura.detalles.map((detalle) => ({
                    descripcion: detalle.descripcion.trim(),
                    cantidad: Number(detalle.cantidad),
                    precio_unitario: Number(detalle.precio_unitario),
                    impuesto: Number(detalle.impuesto)
                }))
            });
            setNuevaFactura(null);
            setDetalleModificado(false);
            setAviso("");
            await cargar();
        } catch (error) {
            console.error("Error registrando factura de proveedor:", error);
            setErrorModal(error.message || "No se pudo registrar la factura.");
        } finally {
            setGuardando(false);
        }
    };

    // ---------- Registrar pago ----------
    const abrirPago = (factura) => {
        setErrorModal("");
        setPago({ monto: String(saldoDe(factura)), metodo_pago: METODOS_PAGO[0], observaciones: "" });
        setFacturaAPagar(factura);
    };

    const guardarPago = async (e) => {
        e.preventDefault();
        const monto = Number(pago.monto);
        const saldo = saldoDe(facturaAPagar);
        if (monto <= 0 || monto > saldo) {
            setErrorModal(`El monto debe ser mayor a cero y no superar el saldo de ${moneda(saldo, facturaAPagar.moneda)}.`);
            return;
        }

        setGuardando(true);
        setErrorModal("");
        try {
            await registrarPagoProveedor({
                factura_proveedor_id: facturaAPagar.factura_proveedor_id,
                usuario_id: usuarioActual?.user_id,
                monto,
                metodo_pago: pago.metodo_pago,
                observaciones: pago.observaciones.trim() || null
            });
            setFacturaAPagar(null);
            await cargar();
        } catch (error) {
            console.error("Error registrando pago a proveedor:", error);
            setErrorModal(error.message || "No se pudo registrar el pago.");
        } finally {
            setGuardando(false);
        }
    };

    const adjuntarPdfAExistente = async (factura, archivo) => {
        if (!archivo) return;
        setPdfSubiendoFacturaId(factura.factura_proveedor_id);
        setAviso("");
        try {
            await adjuntarPdfOriginalProveedor(factura.factura_proveedor_id, archivo);
            setAviso(`PDF original adjuntado a ${factura.codigo_interno}.`);
        } catch (error) {
            setAviso(error.message || "No se pudo adjuntar el PDF original.");
        } finally {
            setPdfSubiendoFacturaId(null);
        }
    };

    const ordenesDelProveedor = nuevaFactura
        ? ordenesCompra.filter((o) => String(o.proveedor_id) === String(nuevaFactura.proveedor_id))
        : [];
    const recepcionesDisponibles = nuevaFactura
        ? recepciones.filter((r) =>
            String(r.proveedor_id) === String(nuevaFactura.proveedor_id) &&
            (!nuevaFactura.compra_id || String(r.compra_id) === nuevaFactura.compra_id)
        )
        : [];
    const ordenSeleccionada = nuevaFactura
        ? ordenesCompra.find((orden) => String(orden.compra_id) === nuevaFactura.compra_id)
        : null;
    const recepcionSeleccionada = nuevaFactura
        ? recepciones.find((recepcion) => String(recepcion.recepcion_id) === nuevaFactura.recepcion_id)
        : null;

    return (
        <>
            {errorCarga && (
                <div className="vm-alert" role="alert">
                    <span className="material-symbols-outlined">error</span>
                    <span>{errorCarga}</span>
                </div>
            )}
            {aviso && <p className="vm-alert" role="status">{aviso}</p>}

            <div className="os-filter-bar compras-facturas-barra">
                <div className="reportes-filter-item">
                    <label>Filtrar por Estado:</label>
                    <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                        <option value="Todos">Todos los Estados</option>
                        {ESTADOS_FACTURA.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                </div>
                <span className="compras-facturas-saldo">
                    Saldo por pagar: <strong>{moneda(saldoPorMoneda.PEN, "PEN")} · {moneda(saldoPorMoneda.USD, "USD")}</strong>
                </span>
                <button type="button" className="vm-btn vm-btn-primary" onClick={abrirNuevaFactura}>
                    <span className="material-symbols-outlined">add</span>
                    Registrar Factura
                </button>
            </div>

            {cargando && <p className="vm-loading" role="status">Consultando facturas de proveedor…</p>}

            <div className="os-table-wrapper">
                <table className="os-table compras-tabla-facturas">
                    <thead>
                        <tr>
                            <th>Comprobante</th>
                            <th>Proveedor</th>
                            <th>N° ODC</th>
                            <th>Recepción</th>
                            <th>Emisión</th>
                            <th>Vencimiento</th>
                            <th className="vm-num">Total</th>
                            <th className="vm-num">Saldo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facturasFiltradas.map((f) => {
                            const saldo = saldoDe(f);
                            const vencida = saldo > 0 && f.fecha_vencimiento && f.fecha_vencimiento.slice(0, 10) < hoy;
                            return (
                                <Fragment key={f.factura_proveedor_id}>
                                <tr>
                                    <td>
                                        <span className="vm-code">{f.codigo_interno}</span>
                                        <div className="compras-celda-secundaria">
                                            {f.tipo_comprobante} · {f.serie}-{f.numero}
                                        </div>
                                    </td>
                                    <td>{nombreProveedor(f.proveedor_id)}</td>
                                    <td>{f.compra_id ? <span className="vm-code">{codigoOrden(f.compra_id) || `#${f.compra_id}`}</span> : "—"}</td>
                                    <td>{f.recepcion_id ? `REC-${f.recepcion_id}` : "—"}</td>
                                    <td>{fechaCorta(f.fecha_emision)}</td>
                                    <td>
                                        {fechaCorta(f.fecha_vencimiento)}
                                        {vencida && <div><span className="vm-badge vm-badge-danger">Vencida</span></div>}
                                    </td>
                                    <td className="vm-num">{moneda(f.total, f.moneda)}</td>
                                    <td className="vm-num"><strong>{moneda(saldo, f.moneda)}</strong></td>
                                    <td><span className={`vm-badge ${claseEstado(f.estado)}`}>{f.estado}</span></td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn-act-table link"
                                            onClick={() => setFacturaExpandidaId(
                                                facturaExpandidaId === f.factura_proveedor_id
                                                    ? null
                                                    : f.factura_proveedor_id
                                            )}
                                        >
                                            <span className="material-symbols-outlined">receipt_long</span>
                                            Detalle
                                        </button>
                                        <a
                                            className="btn-act-table link"
                                            href={urlPdfProveedor(f.factura_proveedor_id, "interno", true)}
                                        >
                                            <span className="material-symbols-outlined">picture_as_pdf</span>
                                            Descargar PDF
                                        </a>
                                        {saldo > 0 ? (
                                            <button type="button" className="btn-act-table nps" onClick={() => abrirPago(f)}>
                                                <span className="material-symbols-outlined">payments</span>
                                                Registrar Pago
                                            </button>
                                        ) : "—"}
                                    </td>
                                </tr>
                                {facturaExpandidaId === f.factura_proveedor_id && (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="compras-factura-detalles">
                                                <strong>Código interno: {f.codigo_interno}</strong>
                                                <strong>Moneda: {f.moneda}</strong>
                                                {(f.detalles || []).map((detalle) => (
                                                    <div key={detalle.detalle_factura_proveedor_id || `${detalle.descripcion}-${detalle.cantidad}`}>
                                                        <span>{detalle.descripcion}</span>
                                                        <span>{detalle.cantidad} × {moneda(detalle.precio_unitario, f.moneda)}</span>
                                                        <span>Impuesto {moneda(detalle.impuesto, f.moneda)}</span>
                                                        <strong>{moneda(detalle.total, f.moneda)}</strong>
                                                    </div>
                                                ))}
                                                    <div className="compras-factura-documentos">
                                                        <a
                                                            className="vm-btn vm-btn-secondary"
                                                            href={urlPdfProveedor(f.factura_proveedor_id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Ver PDF interno
                                                        </a>
                                                        <a
                                                            className="vm-btn vm-btn-secondary"
                                                            href={urlPdfProveedor(f.factura_proveedor_id, "interno", true)}
                                                        >
                                                            Descargar PDF interno
                                                        </a>
                                                        <a
                                                            className="vm-btn vm-btn-secondary"
                                                            href={urlPdfProveedor(f.factura_proveedor_id, "original")}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Ver PDF original
                                                        </a>
                                                        <a
                                                            className="vm-btn vm-btn-secondary"
                                                            href={urlPdfProveedor(f.factura_proveedor_id, "original", true)}
                                                        >
                                                            Descargar original
                                                        </a>
                                                        <label className="vm-btn vm-btn-secondary compras-adjuntar-pdf">
                                                            {pdfSubiendoFacturaId === f.factura_proveedor_id ? "Adjuntando…" : "Adjuntar PDF original"}
                                                            <input
                                                                type="file"
                                                                accept="application/pdf,.pdf"
                                                                disabled={pdfSubiendoFacturaId === f.factura_proveedor_id}
                                                                onChange={(event) => {
                                                                    adjuntarPdfAExistente(f, event.target.files?.[0]);
                                                                    event.target.value = "";
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="compras-factura-sunat">
                                                        <strong>Estado del comprobante ante SUNAT: Pendiente de consulta</strong>
                                                        <span>
                                                            No se consultó este comprobante. La integración disponible solo consulta documentos
                                                            emitidos por VeraMotors; requiere un servicio habilitado para comprobantes de terceros.
                                                        </span>
                                                    </div>
                                                    <div className="compras-factura-totales">
                                                    <span>Subtotal {moneda(f.subtotal, f.moneda)}</span>
                                                    <span>IGV {moneda(f.igv, f.moneda)}</span>
                                                    <strong>Total {moneda(f.total, f.moneda)}</strong>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
                {!cargando && facturasFiltradas.length === 0 && (
                    <div className="vm-empty compras-tabla-vacia">
                        <span className="material-symbols-outlined">receipt_long</span>
                        <strong>Sin facturas de proveedor</strong>
                        <span>No hay comprobantes para el filtro seleccionado.</span>
                    </div>
                )}
            </div>

            {/* MODAL REGISTRAR FACTURA */}
            {nuevaFactura && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Registrar Factura de Proveedor</h2>
                                <p>Comprobante recibido del proveedor, con su orden de compra si corresponde.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setNuevaFactura(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={guardarFactura}>
                            <div className="modal-body">
                                {errorModal && (
                                    <div className="vm-alert" role="alert">
                                        <span className="material-symbols-outlined">error</span>
                                        <span>{errorModal}</span>
                                    </div>
                                )}
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">storefront</span>
                                    Datos del proveedor y documento
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Proveedor *</label>
                                        <select value={nuevaFactura.proveedor_id} onChange={(e) => seleccionarProveedor(e.target.value)} required>
                                            <option value="">Selecciona proveedor</option>
                                            {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social} · RUC {p.ruc}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo de comprobante</label>
                                        <p>Factura</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Serie *</label>
                                        <input type="text" maxLength={20} placeholder="F001" value={nuevaFactura.serie} onChange={(e) => cambiarFactura("serie", e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Número del comprobante *</label>
                                        <input type="text" maxLength={30} placeholder="000123" value={nuevaFactura.numero} onChange={(e) => cambiarFactura("numero", e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de emisión *</label>
                                        <input type="date" value={nuevaFactura.fecha_emision} onChange={(e) => cambiarFactura("fecha_emision", e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de vencimiento</label>
                                        <input type="date" value={nuevaFactura.fecha_vencimiento} onChange={(e) => cambiarFactura("fecha_vencimiento", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Moneda</label>
                                        <select value={nuevaFactura.moneda} onChange={(e) => cambiarFactura("moneda", e.target.value)}>
                                            {MONEDAS.map((monedaItem) => <option key={monedaItem} value={monedaItem}>{monedaItem}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">local_shipping</span>
                                    Relación con compras y recepciones
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Compra relacionada</label>
                                        <select value={nuevaFactura.compra_id} onChange={(e) => seleccionarCompra(e.target.value)}>
                                            <option value="">Sin compra relacionada</option>
                                            {ordenesDelProveedor.map((o) => <option key={o.compra_id} value={o.compra_id}>{o.codigo_compra} · {moneda(o.total)}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Recepción relacionada</label>
                                        <select value={nuevaFactura.recepcion_id} onChange={(e) => cambiarFactura("recepcion_id", e.target.value)}>
                                            <option value="">Sin recepción relacionada</option>
                                            {recepcionesDisponibles.map((r) => <option key={r.recepcion_id} value={r.recepcion_id}>REC-{r.recepcion_id} · {fechaCorta(r.fecha_recepcion)} · {r.estado}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {ordenSeleccionada && (
                                    <div className="compras-factura-relacion">
                                        <strong>{ordenSeleccionada.codigo_compra}</strong>
                                        <span>Estado: {ordenSeleccionada.estado}</span>
                                        <span>Total de la compra: {moneda(ordenSeleccionada.total)}</span>
                                        {(ordenSeleccionada.detalles || []).map((detalle) => (
                                            <span key={detalle.detalle_compra_id || detalle.item_id}>
                                                {[
                                                    detalle.item?.codigo_referencia || detalle.codigo_referencia,
                                                    detalle.item?.nombre_nomenclatura || detalle.descripcion || `Artículo ${detalle.item_id}`
                                                ].filter(Boolean).join(" · ")}
                                                {" · "}{detalle.cantidad} × {moneda(detalle.precio_unitario, nuevaFactura.moneda)}
                                                {" · Impuesto "}{moneda(detalle.impuesto, nuevaFactura.moneda)}
                                                {" · Total "}{moneda(detalle.total, nuevaFactura.moneda)}
                                            </span>
                                        ))}
                                        {Number((ordenSeleccionada.detalles || []).reduce(
                                            (suma, detalle) => suma + Number(detalle.descuento || 0),
                                            0
                                        )) > 0 && (
                                            <span className="vm-alert vm-alert-warning">
                                                La compra contiene descuentos, pero el detalle de factura no tiene una columna de descuento.
                                                Verifica los importes de las líneas antes de registrar.
                                            </span>
                                        )}
                                    </div>
                                )}
                                {recepcionSeleccionada && (
                                    <div className="compras-factura-relacion">
                                        <strong>Mercadería recibida en REC-{recepcionSeleccionada.recepcion_id}</strong>
                                        {(recepcionSeleccionada.detalles || []).map((detalle) => (
                                            <span key={detalle.detalle_recepcion_id || `${detalle.descripcion}-${detalle.item_id}`}>
                                                {detalle.descripcion}: {detalle.cantidad_recibida} recibidas
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">format_list_bulleted</span>
                                    Detalle de la factura
                                </div>
                                <div className="compras-factura-lineas">
                                    {nuevaFactura.detalles.map((detalle, indice) => (
                                        <div className="compras-factura-linea" key={indice}>
                                            <div className="form-group">
                                                <label>Descripción *</label>
                                                <input
                                                    type="text"
                                                    maxLength={255}
                                                    value={detalle.descripcion}
                                                    onChange={(e) => cambiarDetalle(indice, "descripcion", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Cantidad *</label>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => cambiarDetalle(indice, "cantidad", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Precio unitario *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={detalle.precio_unitario}
                                                    onChange={(e) => cambiarDetalle(indice, "precio_unitario", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Impuesto (importe)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={detalle.impuesto}
                                                    onChange={(e) => cambiarDetalle(indice, "impuesto", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Total de línea</label>
                                                <output>{moneda(
                                                    redondear(
                                                        redondear(Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)) +
                                                        redondear(Number(detalle.impuesto || 0))
                                                    ),
                                                    nuevaFactura.moneda
                                                )}</output>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-act-table danger"
                                                onClick={() => quitarDetalle(indice)}
                                                disabled={nuevaFactura.detalles.length === 1}
                                                aria-label={`Quitar línea ${indice + 1}`}
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" className="vm-btn vm-btn-secondary" onClick={agregarDetalle}>
                                        <span className="material-symbols-outlined">add</span>
                                        Agregar línea
                                    </button>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">calculate</span>
                                    Totales
                                </div>
                                <div className="compras-resumen">
                                    <div className="compras-resumen-fila"><span>Subtotal</span><strong>{moneda(importesFactura.subtotal)}</strong></div>
                                    <div className="compras-resumen-fila"><span>IGV</span><strong>{moneda(importesFactura.igv)}</strong></div>
                                    <div className="compras-resumen-fila compras-resumen-total">
                                        <span>TOTAL ({nuevaFactura.moneda}):</span>
                                        <span className="vm-num">{moneda(totalNuevaFactura)}</span>
                                    </div>
                                </div>
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">info</span>
                                    Información adicional
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select value={nuevaFactura.estado} disabled>
                                            <option value="Pendiente">Pendiente</option>
                                        </select>
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Observaciones</label>
                                        <input type="text" value={nuevaFactura.observaciones} onChange={(e) => cambiarFactura("observaciones", e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setNuevaFactura(null)}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardando}>
                                    {guardando ? "Registrando…" : "Registrar Factura"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR PAGO */}
            {facturaAPagar && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal-pago">
                        <div className="modal-header">
                            <div>
                                <h2>Registrar Pago · {facturaAPagar.serie}-{facturaAPagar.numero}</h2>
                                <p>{nombreProveedor(facturaAPagar.proveedor_id)} · Saldo {moneda(saldoDe(facturaAPagar), facturaAPagar.moneda)}</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setFacturaAPagar(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={guardarPago}>
                            <div className="modal-body">
                                {errorModal && (
                                    <div className="vm-alert" role="alert">
                                        <span className="material-symbols-outlined">error</span>
                                        <span>{errorModal}</span>
                                    </div>
                                )}
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Monto (S/) *</label>
                                        <input type="number" min="0.01" step="0.01" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Método de Pago *</label>
                                        <select value={pago.metodo_pago} onChange={(e) => setPago({ ...pago, metodo_pago: e.target.value })}>
                                            {METODOS_PAGO.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Observaciones</label>
                                        <input type="text" placeholder="N° de operación, banco…" value={pago.observaciones} onChange={(e) => setPago({ ...pago, observaciones: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setFacturaAPagar(null)}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardando}>
                                    {guardando ? "Registrando…" : "Registrar Pago"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default FacturasProveedor;
