import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../../services/usuariosService";
import {
    actualizarEstadoRemision,
    crearRemision,
    obtenerDocumentosRemision,
    obtenerRemisiones,
    obtenerVentasDisponiblesRemision,
    registrarDespachoRemision,
} from "../../services/remisionesService";
import "./Remisiones.css";

const fechaHora = (valor) => valor ? new Date(valor).toLocaleString("es-PE") : "-";
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

function Remisiones() {
    const [remisiones, setRemisiones] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
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
        return () => {
            activo = false;
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
            setDetalleAbierto(await obtenerDocumentosRemision(remisionId));
        } catch (detailError) {
            setError(detailError.message || "No se pudo consultar el detalle.");
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
            <header className="remisiones-header">
                <div>
                    <h2>Guías de remisión</h2>
                    <p>Despacho vinculado a ventas confirmadas y existencias de PostgreSQL.</p>
                </div>
                <div className="remisiones-header-actions">
                    <button type="button" className="remisiones-secondary" onClick={cargarDatos} disabled={cargando || guardando}>
                        Actualizar
                    </button>
                    <button type="button" className="remisiones-primary" onClick={abrirFormulario} disabled={!ventas.length}>
                        Nueva guía
                    </button>
                </div>
            </header>

            {error && <div className="remisiones-alert remisiones-alert-error" role="alert">{error}</div>}
            {mensaje && <div className="remisiones-alert remisiones-alert-success" role="status">{mensaje}</div>}

            {mostrarFormulario && (
                <form className="remisiones-form" onSubmit={guardarGuia}>
                    <div className="remisiones-form-heading">
                        <h3>Nueva guía desde venta confirmada</h3>
                        <button type="button" className="remisiones-text-button" onClick={() => setMostrarFormulario(false)}>Cerrar</button>
                    </div>
                    <label>
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
                    <div className="remisiones-fields">
                        <label>
                            Motivo de traslado
                            <input value={motivo} onChange={(event) => setMotivo(event.target.value)} maxLength={100} required />
                        </label>
                        <label>
                            Punto de partida
                            <input value={puntoPartida} onChange={(event) => setPuntoPartida(event.target.value)} maxLength={255} />
                        </label>
                        <label>
                            Punto de llegada
                            <input value={puntoLlegada} onChange={(event) => setPuntoLlegada(event.target.value)} maxLength={255} required />
                        </label>
                    </div>
                    {detalles.length > 0 && (
                        <div className="remisiones-lines">
                            <h4>Productos y cantidades</h4>
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
                    <div className="remisiones-form-actions">
                        <button type="button" className="remisiones-secondary" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                        <button type="submit" className="remisiones-primary" disabled={guardando || !facturaId || !detalles.length}>
                            {guardando ? "Guardando..." : "Generar guía"}
                        </button>
                    </div>
                </form>
            )}

            <div className="remisiones-table-wrap">
                <table className="remisiones-table">
                    <thead>
                        <tr>
                            <th>Guía</th>
                            <th>Venta</th>
                            <th>Cliente</th>
                            <th>Emisión</th>
                            <th>Destino</th>
                            <th>Estado</th>
                            <th>Operaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr><td colSpan="7" className="remisiones-empty">Consultando PostgreSQL...</td></tr>
                        ) : remisiones.length === 0 ? (
                            <tr><td colSpan="7" className="remisiones-empty">No hay guías registradas.</td></tr>
                        ) : remisiones.map((guia) => (
                            <tr key={guia.remision_id}>
                                <td><strong>{guia.numero_remision}</strong></td>
                                <td>{guia.numero_comprobante || "Sin venta vinculada"}</td>
                                <td>{guia.cliente_nombre || `Cliente #${guia.cliente_id}`}</td>
                                <td>{fechaHora(guia.fecha_emision)}</td>
                                <td>{guia.punto_llegada || "-"}</td>
                                <td><span className={`remisiones-state remisiones-state-${guia.estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}>{guia.estado}</span></td>
                                <td className="remisiones-row-actions">
                                    <button type="button" onClick={() => verDetalle(guia.remision_id)}>Detalle</button>
                                    {guia.estado === "Pendiente" && <button type="button" onClick={() => cargarUsuariosDespacho(guia)}>Despachar</button>}
                                    {guia.estado === "Pendiente" && <button type="button" onClick={() => cambiarEstado(guia, "Anulada")} disabled={guardando}>Anular</button>}
                                    {guia.estado === "En tránsito" && <button type="button" onClick={() => cambiarEstado(guia, "Entregada")} disabled={guardando}>Marcar entregada</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {detalleAbierto && (
                <div className="remisiones-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDetalleAbierto(null)}>
                    <section className="remisiones-dialog" role="dialog" aria-modal="true" aria-labelledby="remisiones-detail-title">
                        <div className="remisiones-form-heading">
                            <div><h3 id="remisiones-detail-title">{detalleAbierto.guia.numero_remision}</h3><p>{detalleAbierto.venta?.numero_comprobante || "Guía histórica"}</p></div>
                            <button type="button" className="remisiones-text-button" onClick={() => setDetalleAbierto(null)}>Cerrar</button>
                        </div>
                        <dl className="remisiones-detail-grid">
                            <div><dt>Cliente</dt><dd>{detalleAbierto.cliente?.nombre_razon_social || "-"}</dd></div>
                            <div><dt>Documento</dt><dd>{detalleAbierto.cliente?.documento_identidad || "-"}</dd></div>
                            <div><dt>Estado</dt><dd>{detalleAbierto.guia.estado}</dd></div>
                            <div><dt>Despacho</dt><dd>{fechaHora(detalleAbierto.guia.fecha_despacho)}</dd></div>
                            <div><dt>Destino</dt><dd>{detalleAbierto.guia.punto_llegada || "-"}</dd></div>
                            <div><dt>Vehículo</dt><dd>{detalleAbierto.vehiculo ? `${detalleAbierto.vehiculo.placa} · ${detalleAbierto.vehiculo.marca} ${detalleAbierto.vehiculo.modelo}` : "-"}</dd></div>
                        </dl>
                        <h4>Detalle de la guía</h4>
                        <div className="remisiones-detail-lines">
                            {detalleAbierto.guia.detalles.map((detalle) => (
                                <div key={detalle.detalle_remision_id}><span>{detalle.descripcion}</span><strong>{detalle.cantidad}</strong></div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {confirmarDespacho && (
                <div className="remisiones-overlay" role="presentation">
                    <section className="remisiones-dialog remisiones-dispatch-dialog" role="dialog" aria-modal="true" aria-labelledby="remisiones-dispatch-title">
                        <h3 id="remisiones-dispatch-title">Confirmar despacho</h3>
                        <p>El despacho descontará existencias y registrará movimientos en PostgreSQL.</p>
                        <label>
                            Usuario responsable
                            <select value={usuarioDespachoId} onChange={(event) => setUsuarioDespachoId(event.target.value)} required>
                                <option value="">Selecciona un usuario activo</option>
                                {usuarios.map((usuario) => <option key={usuario.user_id} value={usuario.user_id}>{usuario.nombre}</option>)}
                            </select>
                        </label>
                        <div className="remisiones-form-actions">
                            <button type="button" className="remisiones-secondary" onClick={() => setConfirmarDespacho(null)}>Cancelar</button>
                            <button type="button" className="remisiones-primary" onClick={iniciarDespacho} disabled={guardando || !usuarioDespachoId}>{guardando ? "Despachando..." : "Confirmar despacho"}</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default Remisiones;
