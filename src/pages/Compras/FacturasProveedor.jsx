import { useCallback, useEffect, useMemo, useState } from "react";
import {
    crearFacturaProveedor,
    obtenerFacturasProveedor,
    obtenerPagosProveedor,
    registrarPagoProveedor
} from "../../services/comprasService";

const TASA_IGV = 0.18;
const ESTADOS_FACTURA = ["Pendiente", "Parcialmente pagada", "Pagada"];
const TIPOS_COMPROBANTE = ["Factura", "Boleta", "Recibo por Honorarios", "Nota de Débito"];
const METODOS_PAGO = ["Transferencia", "Efectivo", "Yape/Plin", "Cheque", "Tarjeta"];

const hoyISO = () => {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
};

const redondear = (valor) => Math.round(valor * 100) / 100;
const moneda = (valor) => `S/ ${Number(valor || 0).toFixed(2)}`;
const fechaCorta = (valor) => (valor ? new Date(valor).toLocaleDateString() : "—");

const claseEstado = (estado) => {
    if (estado === "Pagada") return "vm-badge-success";
    if (estado === "Parcialmente pagada") return "vm-badge-warning";
    return "vm-badge-info";
};

const facturaVacia = (proveedorId = "") => ({
    proveedor_id: proveedorId,
    compra_id: "",
    tipo_comprobante: "Factura",
    serie: "",
    numero: "",
    fecha_emision: hoyISO(),
    fecha_vencimiento: "",
    subtotal: "",
    igv: "",
    observaciones: ""
});

function FacturasProveedor({ proveedores, ordenesCompra, usuarioActual }) {
    const [facturas, setFacturas] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");

    const [nuevaFactura, setNuevaFactura] = useState(null);
    const [facturaAPagar, setFacturaAPagar] = useState(null);
    const [pago, setPago] = useState({ monto: "", metodo_pago: METODOS_PAGO[0], observaciones: "" });
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");

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
    const saldoTotal = facturas.reduce((total, f) => total + saldoDe(f), 0);
    const hoy = hoyISO();

    // ---------- Registrar factura ----------
    const abrirNuevaFactura = () => {
        setErrorModal("");
        setNuevaFactura(facturaVacia(String(proveedores[0]?.proveedor_id || "")));
    };

    const cambiarFactura = (campo, valor) => {
        setNuevaFactura((actual) => {
            const siguiente = { ...actual, [campo]: valor };
            if (campo === "proveedor_id") siguiente.compra_id = "";
            if (campo === "subtotal") {
                siguiente.igv = valor === "" ? "" : String(redondear(Number(valor) * TASA_IGV));
            }
            if (campo === "compra_id") {
                const orden = ordenesCompra.find((o) => String(o.compra_id) === valor);
                if (orden) {
                    siguiente.subtotal = String(Number(orden.subtotal));
                    siguiente.igv = String(Number(orden.impuestos));
                }
            }
            return siguiente;
        });
    };

    const totalNuevaFactura = nuevaFactura
        ? redondear(Number(nuevaFactura.subtotal || 0) + Number(nuevaFactura.igv || 0))
        : 0;

    const guardarFactura = async (e) => {
        e.preventDefault();
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
                tipo_comprobante: nuevaFactura.tipo_comprobante,
                serie: nuevaFactura.serie.trim().toUpperCase(),
                numero: nuevaFactura.numero.trim(),
                fecha_emision: `${nuevaFactura.fecha_emision}T00:00:00`,
                fecha_vencimiento: nuevaFactura.fecha_vencimiento ? `${nuevaFactura.fecha_vencimiento}T00:00:00` : null,
                subtotal: Number(nuevaFactura.subtotal || 0),
                igv: Number(nuevaFactura.igv || 0),
                total: totalNuevaFactura,
                observaciones: nuevaFactura.observaciones.trim() || null
            });
            setNuevaFactura(null);
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
            setErrorModal(`El monto debe ser mayor a cero y no superar el saldo de ${moneda(saldo)}.`);
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

    const ordenesDelProveedor = nuevaFactura
        ? ordenesCompra.filter((o) => String(o.proveedor_id) === String(nuevaFactura.proveedor_id))
        : [];

    return (
        <>
            {errorCarga && (
                <div className="vm-alert" role="alert">
                    <span className="material-symbols-outlined">error</span>
                    <span>{errorCarga}</span>
                </div>
            )}

            <div className="os-filter-bar compras-facturas-barra">
                <div className="reportes-filter-item">
                    <label>Filtrar por Estado:</label>
                    <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                        <option value="Todos">Todos los Estados</option>
                        {ESTADOS_FACTURA.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                </div>
                <span className="compras-facturas-saldo">
                    Saldo por pagar: <strong>{moneda(saldoTotal)}</strong>
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
                                <tr key={f.factura_proveedor_id}>
                                    <td>
                                        <span className="vm-code">{f.serie}-{f.numero}</span>
                                        <div className="compras-celda-secundaria">{f.tipo_comprobante}</div>
                                    </td>
                                    <td>{nombreProveedor(f.proveedor_id)}</td>
                                    <td>{f.compra_id ? <span className="vm-code">{codigoOrden(f.compra_id) || `#${f.compra_id}`}</span> : "—"}</td>
                                    <td>{fechaCorta(f.fecha_emision)}</td>
                                    <td>
                                        {fechaCorta(f.fecha_vencimiento)}
                                        {vencida && <div><span className="vm-badge vm-badge-danger">Vencida</span></div>}
                                    </td>
                                    <td className="vm-num">{moneda(f.total)}</td>
                                    <td className="vm-num"><strong>{moneda(saldo)}</strong></td>
                                    <td><span className={`vm-badge ${claseEstado(f.estado)}`}>{f.estado}</span></td>
                                    <td>
                                        {saldo > 0 ? (
                                            <button className="btn-act-table nps" onClick={() => abrirPago(f)}>
                                                <span className="material-symbols-outlined">payments</span>
                                                Registrar Pago
                                            </button>
                                        ) : "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!cargando && (
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
                                    Origen
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Proveedor *</label>
                                        <select value={nuevaFactura.proveedor_id} onChange={(e) => cambiarFactura("proveedor_id", e.target.value)} required>
                                            <option value="">Selecciona proveedor</option>
                                            {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Orden de Compra</label>
                                        <select value={nuevaFactura.compra_id} onChange={(e) => cambiarFactura("compra_id", e.target.value)}>
                                            <option value="">Sin orden de compra</option>
                                            {ordenesDelProveedor.map((o) => <option key={o.compra_id} value={o.compra_id}>{o.codigo_compra} · {moneda(o.total)}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    Comprobante
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tipo *</label>
                                        <select value={nuevaFactura.tipo_comprobante} onChange={(e) => cambiarFactura("tipo_comprobante", e.target.value)}>
                                            {TIPOS_COMPROBANTE.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-grid compras-serie-numero">
                                        <div className="form-group">
                                            <label>Serie *</label>
                                            <input type="text" maxLength={20} placeholder="F001" value={nuevaFactura.serie} onChange={(e) => cambiarFactura("serie", e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Número *</label>
                                            <input type="text" maxLength={30} placeholder="000123" value={nuevaFactura.numero} onChange={(e) => cambiarFactura("numero", e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Emisión *</label>
                                        <input type="date" value={nuevaFactura.fecha_emision} onChange={(e) => cambiarFactura("fecha_emision", e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Vencimiento</label>
                                        <input type="date" value={nuevaFactura.fecha_vencimiento} onChange={(e) => cambiarFactura("fecha_vencimiento", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Subtotal (S/) *</label>
                                        <input type="number" min="0" step="0.01" value={nuevaFactura.subtotal} onChange={(e) => cambiarFactura("subtotal", e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>IGV (S/)</label>
                                        <input type="number" min="0" step="0.01" value={nuevaFactura.igv} onChange={(e) => cambiarFactura("igv", e.target.value)} />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Observaciones</label>
                                        <input type="text" value={nuevaFactura.observaciones} onChange={(e) => cambiarFactura("observaciones", e.target.value)} />
                                    </div>
                                </div>

                                <div className="compras-resumen">
                                    <div className="compras-resumen-fila compras-resumen-total">
                                        <span>TOTAL DEL COMPROBANTE:</span>
                                        <span className="vm-num">{moneda(totalNuevaFactura)}</span>
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
                                <p>{nombreProveedor(facturaAPagar.proveedor_id)} · Saldo {moneda(saldoDe(facturaAPagar))}</p>
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
