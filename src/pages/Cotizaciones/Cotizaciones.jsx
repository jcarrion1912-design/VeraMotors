import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import {
    obtenerCotizaciones,
    crearCotizacion,
    aprobarCotizacion,
    rechazarCotizacion
} from "../../services/cotizacionesService";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerVehiculosCliente } from "../../services/citaService";
import "./Cotizaciones.css";

const moneda = (valor) =>
    Number(valor || 0).toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN"
    });

const fecha = (valor) => {
    if (!valor) return "-";
    const d = new Date(valor);
    return isNaN(d.getTime()) ? String(valor) : d.toLocaleDateString("es-PE");
};

function Cotizaciones() {
    const navigate = useNavigate();
    const { usuarioActual } = useRole();

    const [cotizacionesList, setCotizacionesList] = useState([]);
    const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    // Modal Crear Cotización
    const [mostrarModal, setMostrarModal] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [vehiculosCliente, setVehiculosCliente] = useState([]);
    const [cotizacionCliente, setCotizacionCliente] = useState("");
    const [cotizacionVehiculo, setCotizacionVehiculo] = useState("");
    const [itemsCotizacion, setItemsCotizacion] = useState([]);

    const [nuevoItemDesc, setNuevoItemDesc] = useState("");
    const [nuevoItemPrecio, setNuevoItemPrecio] = useState("");
    const [nuevoItemCantidad, setNuevoItemCantidad] = useState(1);
    const [nuevoItemDescuento, setNuevoItemDescuento] = useState(0);

    const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);

    // Cargar Cotizaciones
    const cargarCotizaciones = async () => {
        try {
            setCargandoCotizaciones(true);
            const data = await obtenerCotizaciones();
            setCotizacionesList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando cotizaciones:", error);
            setCotizacionesList([]);
        } finally {
            setCargandoCotizaciones(false);
        }
    };

    // Cargar Clientes
    const cargarClientes = async () => {
        try {
            const data = await obtenerClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    };

    useEffect(() => {
        cargarCotizaciones();
        cargarClientes();
    }, []);

    // Cargar vehículos al seleccionar cliente
    useEffect(() => {
        if (!cotizacionCliente) {
            setVehiculosCliente([]);
            setCotizacionVehiculo("");
            return;
        }
        obtenerVehiculosCliente(cotizacionCliente)
            .then((data) => {
                setVehiculosCliente(Array.isArray(data) ? data : []);
            })
            .catch(() => setVehiculosCliente([]));
    }, [cotizacionCliente]);

    // Modal Handlers
    const abrirModal = () => {
        setMostrarModal(true);
        setCotizacionCliente("");
        setCotizacionVehiculo("");
        setItemsCotizacion([]);
        setNuevoItemDesc("");
        setNuevoItemPrecio("");
        setNuevoItemCantidad(1);
        setNuevoItemDescuento(0);
    };

    const cerrarModal = () => {
        if (guardandoCotizacion) return;
        setMostrarModal(false);
    };

    // Totales dinámicos
    const totalCotizacion = itemsCotizacion.reduce(
        (total, item) =>
            total +
            Number(item.cantidad) * Number(item.precio_unitario) -
            Number(item.descuento || 0),
        0
    );

    const agregarItem = () => {
        if (!nuevoItemDesc.trim()) {
            alert("Ingresa la descripción del ítem.");
            return;
        }
        if (!nuevoItemPrecio || Number(nuevoItemPrecio) <= 0) {
            alert("Ingresa un precio válido.");
            return;
        }
        if (!nuevoItemCantidad || Number(nuevoItemCantidad) <= 0) {
            alert("Ingresa una cantidad válida.");
            return;
        }

        const item = {
            id: Date.now(),
            item_id: null,
            descripcion: nuevoItemDesc.trim(),
            cantidad: Number(nuevoItemCantidad),
            precio_unitario: Number(nuevoItemPrecio),
            descuento: Number(nuevoItemDescuento) || 0
        };

        setItemsCotizacion((prev) => [...prev, item]);
        setNuevoItemDesc("");
        setNuevoItemPrecio("");
        setNuevoItemCantidad(1);
        setNuevoItemDescuento(0);
    };

    const eliminarItem = (id) => {
        setItemsCotizacion((prev) => prev.filter((item) => item.id !== id));
    };

    const handleGuardar = async () => {
        if (!cotizacionCliente) {
            alert("Selecciona un cliente para la cotización.");
            return;
        }
        if (!cotizacionVehiculo) {
            alert("Selecciona un vehículo para la cotización.");
            return;
        }
        if (itemsCotizacion.length === 0) {
            alert("Agrega al menos un ítem a la cotización.");
            return;
        }

        try {
            setGuardandoCotizacion(true);

            const subtotalCalculado = itemsCotizacion.reduce(
                (acc, item) =>
                    acc + Number(item.cantidad) * Number(item.precio_unitario),
                0
            );
            const descuentosCalculados = itemsCotizacion.reduce(
                (acc, item) => acc + Number(item.descuento || 0),
                0
            );
            const impuestosCalculados = itemsCotizacion.reduce((acc, item) => {
                const base =
                    Number(item.cantidad) * Number(item.precio_unitario) -
                    Number(item.descuento || 0);
                return acc + base * 0.18;
            }, 0);

            const payload = {
                cliente_id: Number(cotizacionCliente),
                vehiculo_id: Number(cotizacionVehiculo),
                subtotal: Number(subtotalCalculado.toFixed(2)),
                descuentos: Number(descuentosCalculados.toFixed(2)),
                impuestos: Number(impuestosCalculados.toFixed(2)),
                total: Number(totalCotizacion.toFixed(2)),
                estado: "Pendiente",
                detalles: itemsCotizacion.map((item) => {
                    const subtotal =
                        Number(item.cantidad) * Number(item.precio_unitario);
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

            await crearCotizacion(payload);
            alert("Cotización registrada correctamente.");
            setMostrarModal(false);
            await cargarCotizaciones();
        } catch (error) {
            console.error("Error registrando cotización:", error);
            alert(error.message || "Ocurrió un error al registrar la cotización.");
        } finally {
            setGuardandoCotizacion(false);
        }
    };

    const handleActualizarEstado = async (cotizacionId, accion) => {
        if (!usuarioActual?.user_id) {
            alert("Debes iniciar sesión para ejecutar esta acción.");
            return;
        }

        try {
            if (accion === "aprobar") {
                await aprobarCotizacion(cotizacionId, {
                    usuario_id: usuarioActual.user_id,
                    motivo: "Aprobada por el usuario"
                });
                alert("Cotización aprobada correctamente.");
            } else {
                const motivo = prompt(
                    "Ingresa el motivo del rechazo:",
                    "No cumple requisitos para continuar con la venta."
                );
                if (motivo === null) return;
                await rechazarCotizacion(cotizacionId, {
                    usuario_id: usuarioActual.user_id,
                    motivo: motivo || "Rechazada por el usuario"
                });
                alert("Cotización rechazada correctamente.");
            }
            await cargarCotizaciones();
        } catch (error) {
            console.error(`Error al ${accion} cotización:`, error);
            alert(error.message || `No se pudo ${accion} la cotización.`);
        }
    };

    // Navegar a Facturación con la cotización pre-cargada
    const handleFacturar = (cotizacion) => {
        if (cotizacion.estado !== "Aprobada") {
            alert("La cotización debe estar aprobada antes de facturar.");
            return;
        }
        navigate("/facturacion", {
            state: { cotizacion }
        });
    };

    const cotizacionesFiltradas = cotizacionesList.filter((c) => {
        const query = busqueda.trim().toLowerCase();
        if (!query) return true;
        const cod = String(c.codigo_cotizacion || "").toLowerCase();
        const cli = String(c.cliente_nombre || "").toLowerCase();
        const pla = String(c.vehiculo_placa || "").toLowerCase();
        return cod.includes(query) || cli.includes(query) || pla.includes(query);
    });

    return (
        <div className="cotizaciones-page">
            <div className="cotizaciones-header">
                <div className="cotizaciones-title">
                    <h1>Cotizaciones</h1>
                    <p>Gestión comercial y elaboración de presupuestos para clientes</p>
                </div>

                <div className="cotizaciones-actions">
                    <input
                        type="text"
                        className="cotizaciones-search-input"
                        placeholder="Buscar por código, cliente o placa..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn-nueva-cotizacion"
                        onClick={abrirModal}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nueva Cotización
                    </button>
                </div>
            </div>

            {/* FORMULARIO REGISTRAR COTIZACIÓN */}
            {mostrarModal && (
                <div className="modal-cotizacion-card">
                    <div className="modal-cotizacion-header">
                        <h3>Registrar nueva cotización</h3>
                        <button
                            type="button"
                            className="btn-accion-cot btn-accion-rechazar"
                            onClick={cerrarModal}
                            disabled={guardandoCotizacion}
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="form-grid-cotizacion">
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                Cliente *
                            </label>
                            <select
                                value={cotizacionCliente}
                                onChange={(e) => setCotizacionCliente(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1"
                                }}
                            >
                                <option value="">Seleccione un cliente</option>
                                {clientes.map((c) => (
                                    <option key={c.cliente_id} value={c.cliente_id}>
                                        {c.nombre_razon_social} - {c.documento_identidad}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                Vehículo *
                            </label>
                            <select
                                value={cotizacionVehiculo}
                                onChange={(e) => setCotizacionVehiculo(e.target.value)}
                                disabled={!cotizacionCliente}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1"
                                }}
                            >
                                <option value="">Seleccione un vehículo</option>
                                {vehiculosCliente.map((v) => (
                                    <option key={v.vehiculo_id} value={v.vehiculo_id}>
                                        {v.placa} · {v.marca} {v.modelo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="items-box-cotizacion">
                        <h4>Items y servicios presupuestados</h4>
                        <div className="items-input-row">
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600 }}>
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Cambio de pastillas de freno"
                                    value={nuevoItemDesc}
                                    onChange={(e) => setNuevoItemDesc(e.target.value)}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600 }}>
                                    Precio Unitario (S/)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={nuevoItemPrecio}
                                    onChange={(e) => setNuevoItemPrecio(e.target.value)}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600 }}>
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={nuevoItemCantidad}
                                    onChange={(e) => setNuevoItemCantidad(e.target.value)}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600 }}>
                                    Desc. (S/)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={nuevoItemDescuento}
                                    onChange={(e) => setNuevoItemDescuento(e.target.value)}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn-agregar-item"
                                onClick={agregarItem}
                            >
                                Agregar
                            </button>
                        </div>

                        {itemsCotizacion.length === 0 ? (
                            <p style={{ color: "#64748b", margin: "8px 0" }}>No hay ítems agregados todavía.</p>
                        ) : (
                            <table className="items-table">
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
                                                    <button
                                                        type="button"
                                                        className="btn-accion-cot btn-accion-rechazar"
                                                        onClick={() => eliminarItem(item.id)}
                                                    >
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

                    <div className="modal-cotizacion-footer">
                        <div className="total-cotizacion-badge">
                            Total cotización: {moneda(totalCotizacion)}
                        </div>
                        <button
                            type="button"
                            className="btn-nueva-cotizacion"
                            onClick={handleGuardar}
                            disabled={guardandoCotizacion}
                            style={{ opacity: guardandoCotizacion ? 0.7 : 1 }}
                        >
                            {guardandoCotizacion ? "Guardando..." : "Guardar Cotización"}
                        </button>
                    </div>
                </div>
            )}

            {/* TABLA DE COTIZACIONES */}
            <div className="cotizaciones-table-wrapper">
                <table className="cotizaciones-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Vehículo</th>
                            <th>Subtotal</th>
                            <th>Impuestos</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargandoCotizaciones ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    Cargando cotizaciones desde PostgreSQL...
                                </td>
                            </tr>
                        ) : cotizacionesFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                    No se encontraron cotizaciones registradas.
                                </td>
                            </tr>
                        ) : (
                            cotizacionesFiltradas.map((cot) => (
                                <tr key={cot.cotizacion_id}>
                                    <td><strong>{cot.codigo_cotizacion}</strong></td>
                                    <td>{fecha(cot.fecha)}</td>
                                    <td>{cot.cliente_nombre || "Cliente"}</td>
                                    <td>
                                        {cot.vehiculo_placa
                                            ? `${cot.vehiculo_placa}${cot.vehiculo_modelo ? ` (${cot.vehiculo_modelo})` : ""}`
                                            : "-"}
                                    </td>
                                    <td>{moneda(cot.subtotal || 0)}</td>
                                    <td>{moneda(cot.impuestos || 0)}</td>
                                    <td><strong>{moneda(cot.total)}</strong></td>
                                    <td>
                                        <span
                                            className={`badge-estado ${
                                                cot.estado === "Aprobada"
                                                    ? "badge-aprobada"
                                                    : cot.estado === "Rechazada"
                                                    ? "badge-rechazada"
                                                    : "badge-pendiente"
                                            }`}
                                        >
                                            {cot.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {cot.estado === "Pendiente" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn-accion-cot btn-accion-aprobar"
                                                        onClick={() => handleActualizarEstado(cot.cotizacion_id, "aprobar")}
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-accion-cot btn-accion-rechazar"
                                                        onClick={() => handleActualizarEstado(cot.cotizacion_id, "rechazar")}
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                type="button"
                                                className="btn-accion-cot btn-accion-facturar"
                                                disabled={cot.estado !== "Aprobada"}
                                                onClick={() => handleFacturar(cot)}
                                                title={cot.estado === "Aprobada" ? "Generar factura desde esta cotización" : "Debe estar aprobada para facturar"}
                                            >
                                                Facturar
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
    );
}

export default Cotizaciones;

