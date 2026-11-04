import { useEffect, useRef, useState } from "react";
import { obtenerUsuarios } from "../../services/usuariosService";
import {
    actualizarEstadoRemision,
    crearRemision,
    obtenerDocumentosRemision,
    obtenerRemisiones,
    obtenerVentasDisponiblesRemision,
    registrarDespachoRemision,
    descargarPdfRemision,
} from "../../services/remisionesService";
import "./Remisiones.css";

const fechaHora = (valor) => valor ? new Date(valor).toLocaleString("es-PE") : "-";
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
const slugEstado = (estado) => (estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

function Remisiones() {
    const [remisiones, setRemisiones] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [descargandoPdf, setDescargandoPdf] = useState(null); // remision_id en descarga
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [facturaId, setFacturaId] = useState("");
    const [detalles, setDetalles] = useState([]);
    const [motivo, setMotivo] = useState("Venta");
    const [puntoPartida, setPuntoPartida] = useState("");
    const [puntoLlegada, setPuntoLlegada] = useState("");
    const [detalleAbierto, setDetalleAbierto] = useState(null);
    const [confirmarDespacho, setConfirmarDespacho] = useState(null);
    const [usuarioDespachoId, setUsuarioDespachoId] = useState("");

    // Rastreamos object URLs para liberarlas después de usar
    const pdfUrlRef = useRef(null);

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [guias, ventasDisponibles] = await Promise.all([
                obtenerRemisiones(),
                obtenerVentasDisponiblesRemision(),
            ]);
            setRemisiones(guias);
            setVentas(ventasDisponibles);
        } catch (loadError) {
            setError(loadError.message || "No se pudieron cargar las guías.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activo = true;
        Promise.all([obtenerRemisiones(), obtenerVentasDisponiblesRemision()])
            .then(([guias, ventasDisponibles]) => {
                if (!activo) return;
                setRemisiones(guias);
                setVentas(ventasDisponibles);
            })
            .catch((loadError) => {
                if (activo) setError(loadError.message || "No se pudieron cargar las guías.");
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => { activo = false; };
    }, []);

    // Libera la object URL anterior al desmontar
    useEffect(() => {
        return () => {
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
                pdfUrlRef.current = null;
            }
        };
    }, []);

    const seleccionarVenta = (value) => {
        setFacturaId(value);
        const venta = ventas.find((item) => String(item.factura_id) === value);
        setDetalles((venta?.detalles || []).map((detalle) => ({
            factura_detalle_id: detalle.factura_detalle_id,
            descripcion: detalle.descripcion,
            cantidad_vendida: Number(detalle.cantidad_vendida),
            cantidad: String(detalle.cantidad_vendida),
        })));
    };

    const abrirFormulario = () => {
        setMensaje("");
        setError("");
        setMostrarFormulario(true);
        setFacturaId("");
        setDetalles([]);
        setMotivo("Venta");
        setPuntoPartida("");
        setPuntoLlegada("");
    };

    const guardarGuia = async (event) => {
        event.preventDefault();
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            const guia = await crearRemision({
                factura_id: Number(facturaId),
                motivo_traslado: motivo,
                punto_partida: puntoPartida || null,
                punto_llegada: puntoLlegada,
                detalles: detalles.map((detalle) => ({
                    factura_detalle_id: Number(detalle.factura_detalle_id),
                    cantidad: Number(detalle.cantidad),
                })),
            });
            setMostrarFormulario(false);
            setMensaje(`Guía ${guia.numero_remision} registrada.`);
            await cargarDatos();
        } catch (saveError) {
            setError(saveError.message || "No se pudo registrar la guía.");
        } finally {
            setGuardando(false);
        }
    };

    const verDetalle = async (remisionId) => {
        setError("");
        try {
            const data = await obtenerDocumentosRemision(remisionId);
            setDetalleAbierto(data);
        } catch (detailError) {
            setError(detailError.message || "No se pudo consultar el detalle.");
        }
    };

    const verPdf = async (guia) => {
        setDescargandoPdf(guia.remision_id);
        setError("");
        try {
            const blob = await descargarPdfRemision(guia.remision_id);

            // Verificamos que sea realmente un PDF
            if (!blob || blob.type !== "application/pdf") {
                throw new Error("El servidor no devolvió un archivo PDF válido.");
            }

            // Liberamos la URL anterior si existe
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
            }
            const url = URL.createObjectURL(blob);
            pdfUrlRef.current = url;
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (pdfError) {
            // Extraer el mensaje de error del JSON si viene como texto
            let msg = pdfError.message || "No se pudo obtener el PDF.";
            try {
                const parsed = JSON.parse(msg);
                if (parsed?.detail) msg = parsed.detail;
            } catch { /* msg ya es legible */ }
            setError(`PDF no disponible para ${guia.numero_remision}: ${msg}`);
        } finally {
            setDescargandoPdf(null);
        }
    };

    const iniciarDespacho = async () => {
        if (!usuarioDespachoId) {
            setError("Selecciona el usuario responsable del despacho.");
            return;
        }
        setGuardando(true);
        setError("");
        try {
            const guia = await registrarDespachoRemision(confirmarDespacho.remision_id, usuarioDespachoId);
            setMensaje(`Guía ${guia.numero_remision} despachada; inventario actualizado.`);
            setConfirmarDespacho(null);
            setUsuarioDespachoId("");
            await cargarDatos();
            if (detalleAbierto?.guia?.remision_id === guia.remision_id) {
                await verDetalle(guia.remision_id);
            }
        } catch (dispatchError) {
            setError(dispatchError.message || "No se pudo registrar el despacho.");
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async (guia, estado) => {
        setGuardando(true);
        setError("");
        setMensaje("");
        try {
            await actualizarEstadoRemision(guia.remision_id, estado);
            setMensaje(`La guía ${guia.numero_remision} ahora está ${estado.toLowerCase()}.`);
            await cargarDatos();
        } catch (stateError) {
            setError(stateError.message || "No se pudo actualizar el estado.");
        } finally {
            setGuardando(false);
        }
    };

    const cargarUsuariosDespacho = async (guia) => {
        setError("");
        try {
            const listaUsuarios = await obtenerUsuarios();
            const activos = listaUsuarios.filter((usuario) => usuario.activo);
            setUsuarios(activos);
            setUsuarioDespachoId("");
            setConfirmarDespacho(guia);
        } catch (usersError) {
            setError(usersError.message || "No se pudieron cargar los usuarios activos.");
        }
    };

    const ventaSeleccionada = ventas.find((venta) => String(venta.factura_id) === facturaId);

    return (
        <section className="remisiones-page">
            <header className="vm-page-head">
                <div>
                    <h2>Guías de remisión</h2>
                    <p>Despacho vinculado a ventas confirmadas y existencias de PostgreSQL.</p>
                </div>
                <div className="remisiones-header-actions">
                    <button type="button" className="vm-btn vm-btn-secondary" onClick={cargarDatos} disabled={cargando || guardando}>
                        <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
                        Actualizar
                    </button>
                    <button type="button" className="vm-btn vm-btn-primary" onClick={abrirFormulario} disabled={!ventas.length}>
                        <span className="material-symbols-outlined" aria-hidden="true">add</span>
                        Nueva guía
                    </button>
                </div>
            </header>

            {!ventas.length && !cargando && !mostrarFormulario && (
                <div className="vm-alert vm-alert-info" role="note">
                    <span className="material-symbols-outlined" aria-hidden="true">info</span>
                    No hay ventas pagadas y aceptadas sin guía. Regístralas primero en Facturación.
                </div>
            )}
            {error && <div className="vm-alert" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}
            {mensaje && <div className="vm-alert vm-alert-success" role="status"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span>{mensaje}</div>}

            {mostrarFormulario && (
                <form className="vm-card" onSubmit={guardarGuia}>
                    <div className="vm-card-head">
                        <h3><span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>Nueva guía desde venta confirmada</h3>
                        <button type="button" className="vm-btn vm-btn-ghost vm-btn-sm" onClick={() => setMostrarFormulario(false)}>Cerrar</button>
                    </div>
                    <div className="vm-card-body remisiones-form-body">
                        <label className="form-group">
                            Venta / comprobante
                            <select value={facturaId} onChange={(event) => seleccionarVenta(event.target.value)} required>
                                <option value="">Selecciona una venta pagada</option>
                                {ventas.map((venta) => (
                                    <option key={venta.factura_id} value={venta.factura_id}>
                                        {venta.numero_comprobante} · {venta.cliente_nombre} · {moneda(venta.total)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {ventaSeleccionada && (
                            <div className="remisiones-sale-summary">
                                <strong>{ventaSeleccionada.cliente_nombre}</strong>
                                <span>{ventaSeleccionada.cliente_documento} · {ventaSeleccionada.estado_pago} · SUNAT {ventaSeleccionada.estado_sunat}</span>
                            </div>
                        )}
                        <div>
                            <div className="vm-form-section-title"><span className="material-symbols-outlined" aria-hidden="true">route</span>Datos del traslado</div>
                            <div className="form-grid remisiones-fields">
                                <label className="form-group">
                                    Motivo de traslado
                                    <input value={motivo} onChange={(event) => setMotivo(event.target.value)} maxLength={100} required />
                                </label>
                                <label className="form-group">
                                    Punto de partida
                                    <input value={puntoPartida} onChange={(event) => setPuntoPartida(event.target.value)} maxLength={255} placeholder="Dirección de origen (opcional)" />
                                </label>
                                <label className="form-group">
                                    Punto de llegada
                                    <input value={puntoLlegada} onChange={(event) => setPuntoLlegada(event.target.value)} maxLength={255} required placeholder="Dirección de destino" />
                                </label>
                            </div>
                        </div>
                        {detalles.length > 0 && (
                            <div>
                                <div className="vm-form-section-title"><span className="material-symbols-outlined" aria-hidden="true">inventory_2</span>Productos y cantidades a trasladar</div>
                                {detalles.map((detalle, index) => (
                                    <label className="remisiones-line" key={detalle.factura_detalle_id}>
                                        <span>{detalle.descripcion}<small>Vendido: {detalle.cantidad_vendida}</small></span>
                                        <input
                                            type="number"
                                            min="0.01"
                                            max={detalle.cantidad_vendida}
                                            step="0.01"
                                            value={detalle.cantidad}
                                            onChange={(event) => setDetalles((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, cantidad: event.target.value } : line))}
                                            required
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="remisiones-form-actions">
                        <button type="button" className="vm-btn vm-btn-secondary" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                        <button type="submit" className="vm-btn vm-btn-primary" disabled={guardando || !facturaId || !detalles.length}>
                            {guardando ? "Guardando..." : "Generar guía"}
                        </button>
                    </div>
                </form>
            )}

            <div className="vm-table-wrap">
                <table className="vm-table remisiones-table">
                    <thead>
                        <tr>
                            <th>Guía</th>
                            <th>Venta</th>
                            <th>Cliente</th>
                            <th>Emisión</th>
                            <th>Destino</th>
                            <th>Estado</th>
                            <th>SUNAT</th>
                            <th>Operaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr><td colSpan="8"><div className="vm-loading remisiones-loading">Consultando PostgreSQL...</div></td></tr>
                        ) : remisiones.length === 0 ? (
                            <tr><td colSpan="8"><div className="vm-empty"><span className="material-symbols-outlined" aria-hidden="true">local_shipping</span><strong>No hay guías registradas.</strong></div></td></tr>
                        ) : remisiones.map((guia) => (
                            <tr key={guia.remision_id}>
                                <td><span className="vm-code">{guia.numero_remision}</span></td>
                                <td><span className={guia.numero_comprobante ? "vm-code" : "remisiones-muted"}>{guia.numero_comprobante || "Sin venta vinculada"}</span></td>
                                <td>{guia.cliente_nombre || `Cliente #${guia.cliente_id}`}</td>
                                <td>{fechaHora(guia.fecha_emision)}</td>
                                <td>{guia.punto_llegada || "-"}</td>
                                <td><span className={`vm-badge remisiones-state-${slugEstado(guia.estado)}`}>{guia.estado}</span></td>
                                <td><span className={`vm-badge remisiones-state-sunat-${slugEstado(guia.estado_sunat)}`}>{guia.estado_sunat || "Pendiente"}</span></td>
                                <td>
                                    <div className="table-actions">
                                        <button type="button" className="btn-act-table" onClick={() => verDetalle(guia.remision_id)}><span className="material-symbols-outlined" aria-hidden="true">visibility</span>Detalle</button>
                                        <button
                                            type="button"
                                            className="btn-act-table"
                                            onClick={() => verPdf(guia)}
                                            disabled={descargandoPdf === guia.remision_id}
                                            title={guia.estado_sunat === "Aceptado" ? "Descargar PDF oficial SUNAT" : "PDF no disponible (guía no aceptada por SUNAT)"}
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                                            {descargandoPdf === guia.remision_id ? "..." : "Ver PDF"}
                                        </button>
                                        {guia.estado === "Pendiente" && <button type="button" className="btn-act-table link" onClick={() => cargarUsuariosDespacho(guia)}><span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>Despachar</button>}
                                        {guia.estado === "Pendiente" && <button type="button" className="btn-act-table remisiones-act-danger" onClick={() => cambiarEstado(guia, "Anulada")} disabled={guardando}><span className="material-symbols-outlined" aria-hidden="true">block</span>Anular</button>}
                                        {guia.estado === "En tránsito" && <button type="button" className="btn-act-table nps" onClick={() => cambiarEstado(guia, "Entregada")} disabled={guardando}><span className="material-symbols-outlined" aria-hidden="true">task_alt</span>Marcar entregada</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {detalleAbierto && (
                <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDetalleAbierto(null)}>
                    <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="remisiones-detail-title">
                        <div className="modal-header">
                            <div>
                                <h3 id="remisiones-detail-title">{detalleAbierto.guia?.numero_remision}</h3>
                                <p>{detalleAbierto.venta?.numero_comprobante || "Guía histórica"}</p>
                            </div>
                            <div className="remisiones-dialog-actions">
                                <button
                                    type="button"
                                    className="vm-btn vm-btn-sm remisiones-header-btn"
                                    onClick={() => verPdf(detalleAbierto.guia)}
                                    disabled={descargandoPdf === detalleAbierto.guia?.remision_id}
                                    title={detalleAbierto.guia?.estado_sunat === "Aceptado" ? "PDF oficial SUNAT" : "Guía pendiente de aceptación SUNAT"}
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                                    {descargandoPdf === detalleAbierto.guia?.remision_id ? "Obteniendo..." : "Ver PDF"}
                                </button>
                                <button type="button" className="btn-close" onClick={() => setDetalleAbierto(null)} aria-label="Cerrar"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
                            </div>
                        </div>
                        <div className="modal-body remisiones-detail-body">
                            <dl className="remisiones-detail-grid">
                                <div><dt>Cliente</dt><dd>{detalleAbierto.cliente?.nombre_razon_social || "-"}</dd></div>
                                <div><dt>Documento</dt><dd>{detalleAbierto.cliente?.documento_identidad || "-"}</dd></div>
                                <div><dt>Motivo</dt><dd>{detalleAbierto.guia?.motivo_traslado || "-"}</dd></div>
                                <div><dt>Origen</dt><dd>{detalleAbierto.guia?.punto_partida || "-"}</dd></div>
                                <div><dt>Destino</dt><dd>{detalleAbierto.guia?.punto_llegada || "-"}</dd></div>
                                <div><dt>Estado guía</dt><dd><span className={`vm-badge remisiones-state-${slugEstado(detalleAbierto.guia?.estado)}`}>{detalleAbierto.guia?.estado}</span></dd></div>
                                <div><dt>Estado SUNAT</dt><dd><span className={`vm-badge remisiones-state-sunat-${slugEstado(detalleAbierto.guia?.estado_sunat)}`}>{detalleAbierto.guia?.estado_sunat || "Pendiente"}</span></dd></div>
                                <div><dt>Fecha emisión</dt><dd>{fechaHora(detalleAbierto.guia?.fecha_emision)}</dd></div>
                                <div><dt>Fecha despacho</dt><dd>{fechaHora(detalleAbierto.guia?.fecha_despacho)}</dd></div>
                                <div><dt>Vehículo</dt><dd>{detalleAbierto.vehiculo ? `${detalleAbierto.vehiculo.placa} · ${detalleAbierto.vehiculo.marca} ${detalleAbierto.vehiculo.modelo}` : "-"}</dd></div>
                            </dl>
                            {detalleAbierto.guia?.estado_sunat !== "Aceptado" && (
                                <p className="vm-alert vm-alert-warning">
                                    <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                                    Esta guía aún no ha sido aceptada por SUNAT. El PDF electrónico oficial no está disponible.
                                </p>
                            )}
                            <div>
                                <h4 className="vm-form-section-title"><span className="material-symbols-outlined" aria-hidden="true">inventory_2</span>Detalle de bienes a trasladar</h4>
                                <div className="remisiones-detail-lines">
                                    {(detalleAbierto.guia?.detalles || []).map((detalle) => (
                                        <div key={detalle.detalle_remision_id}>
                                            <span>{detalle.descripcion}</span>
                                            <strong>{Number(detalle.cantidad).toLocaleString("es-PE")}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {confirmarDespacho && (
                <div className="modal-overlay" role="presentation">
                    <section className="modal-content remisiones-dispatch-dialog" role="dialog" aria-modal="true" aria-labelledby="remisiones-dispatch-title">
                        <div className="modal-header">
                            <h3 id="remisiones-dispatch-title">Confirmar despacho</h3>
                        </div>
                        <div className="modal-body remisiones-detail-body">
                            <p className="vm-alert vm-alert-warning">
                                <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                                El despacho descontará existencias y registrará movimientos en PostgreSQL.
                            </p>
                            <label className="form-group">
                                Usuario responsable
                                <select value={usuarioDespachoId} onChange={(event) => setUsuarioDespachoId(event.target.value)} required>
                                    <option value="">Selecciona un usuario activo</option>
                                    {usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-cancelar" onClick={() => setConfirmarDespacho(null)}>Cancelar</button>
                            <button type="button" className="btn-guardar" onClick={iniciarDespacho} disabled={guardando || !usuarioDespachoId}><span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>{guardando ? "Despachando..." : "Confirmar despacho"}</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default Remisiones;
