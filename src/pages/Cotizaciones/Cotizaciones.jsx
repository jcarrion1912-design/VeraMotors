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
                    <div className="vm-search cotizaciones-search">
                        <span className="material-symbols-outlined">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por código, cliente o placa..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            aria-label="Buscar por código, cliente o placa"
                        />
                    </div>
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
                <div className="modal-overlay">
                    <div className="modal-content modal-cotizacion-card">
                        <div className="modal-header">
                            <h3>Registrar nueva cotización</h3>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={cerrarModal}
                                disabled={guardandoCotizacion}
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined">person</span>
                                Cliente y vehículo
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>
                                        Cliente *
                                    </label>
                                    <select
                                        value={cotizacionCliente}
                                        onChange={(e) => setCotizacionCliente(e.target.value)}
                                    >
                                        <option value="">Seleccione un cliente</option>
                                        {clientes.map((c) => (
                                            <option key={c.cliente_id} value={c.cliente_id}>
                                                {c.nombre_razon_social} - {c.documento_identidad}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Vehículo *
                                    </label>
                                    <select
                                        value={cotizacionVehiculo}
                                        onChange={(e) => setCotizacionVehiculo(e.target.value)}
                                        disabled={!cotizacionCliente}
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
                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined">format_list_bulleted</span>
                                    Items y servicios presupuestados
                                </h4>
                                <div className="items-input-row">
                                    <div className="form-group">
                                        <label>
                                            Descripción
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Cambio de pastillas de freno"
                                            value={nuevoItemDesc}
                                            onChange={(e) => setNuevoItemDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Precio Unitario (S/)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={nuevoItemPrecio}
                                            onChange={(e) => setNuevoItemPrecio(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={nuevoItemCantidad}
                                            onChange={(e) => setNuevoItemCantidad(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Desc. (S/)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={nuevoItemDescuento}
                                            onChange={(e) => setNuevoItemDescuento(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="vm-btn vm-btn-primary"
                                        onClick={agregarItem}
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                        Agregar
                                    </button>
                                </div>

                                {itemsCotizacion.length === 0 ? (
                                    <div className="vm-empty cot-items-vacio">
                                        <span className="material-symbols-outlined">playlist_add</span>
                                        No hay ítems agregados todavía.
                                    </div>
                                ) : (
                                    <div className="vm-table-wrap">
                                        <table className="vm-table cot-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Descripción</th>
                                                    <th className="vm-num">Cant.</th>
                                                    <th className="vm-num">P. Unit</th>
                                                    <th className="vm-num">Desc.</th>
                                                    <th className="vm-num">Total</th>
                                                    <th>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemsCotizacion.map((item) => {
                                                    const subtotal = Number(item.cantidad) * Number(item.precio_unitario);
                                                    const totalItem = subtotal - Number(item.descuento || 0);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{item.descripcion}</td>
                                                            <td className="vm-num">{item.cantidad}</td>
                                                            <td className="vm-num">{moneda(item.precio_unitario)}</td>
                                                            <td className="vm-num">{moneda(item.descuento || 0)}</td>
                                                            <td className="vm-num"><strong>{moneda(totalItem)}</strong></td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="btn-act-table danger"
                                                                    onClick={() => eliminarItem(item.id)}
                                                                >
                                                                    <span className="material-symbols-outlined">delete</span>
                                                                    Quitar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div className="total-cotizacion-badge">
                                <span>Total cotización</span>
                                <strong>{moneda(totalCotizacion)}</strong>
                            </div>
                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={handleGuardar}
                                disabled={guardandoCotizacion}
                            >
                                <span className="material-symbols-outlined">save</span>
                                {guardandoCotizacion ? "Guardando..." : "Guardar Cotización"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA DE COTIZACIONES */}
            <div className="vm-table-wrap">
                <table className="vm-table cotizaciones-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Vehículo</th>
                            <th className="vm-num">Subtotal</th>
                            <th className="vm-num">Impuestos</th>
                            <th className="vm-num">Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargandoCotizaciones ? (
                            <tr>
                                <td colSpan="9">
                                    <div className="vm-loading cot-tabla-cargando" role="status">
                                        Cargando cotizaciones...
                                    </div>
                                </td>
                            </tr>
                        ) : cotizacionesFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="9">
                                    <div className="vm-empty">
                                        <span className="material-symbols-outlined">request_quote</span>
                                        <strong>No se encontraron cotizaciones registradas.</strong>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            cotizacionesFiltradas.map((cot) => (
                                <tr key={cot.cotizacion_id}>
                                    <td><span className="vm-code">{cot.codigo_cotizacion}</span></td>
                                    <td className="cot-fecha">{fecha(cot.fecha)}</td>
                                    <td className="cot-cliente">{cot.cliente_nombre || "Cliente"}</td>
                                    <td>
                                        {cot.vehiculo_placa ? (
                                            <div className="cot-vehiculo">
                                                <span className="vm-plate">{cot.vehiculo_placa}</span>
                                                {cot.vehiculo_modelo && <span>{cot.vehiculo_modelo}</span>}
                                            </div>
                                        ) : (
                                            <span className="cot-sin-vehiculo">-</span>
                                        )}
                                    </td>
                                    <td className="vm-num">{moneda(cot.subtotal || 0)}</td>
                                    <td className="vm-num">{moneda(cot.impuestos || 0)}</td>
                                    <td className="vm-num"><strong>{moneda(cot.total)}</strong></td>
                                    <td>
                                        <span
                                            className={`vm-badge ${
                                                cot.estado === "Aprobada"
                                                    ? "vm-badge-success"
                                                    : cot.estado === "Rechazada"
                                                    ? "vm-badge-danger"
                                                    : "vm-badge-warning"
                                            }`}
                                        >
                                            {cot.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {cot.estado === "Pendiente" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn-act-table nps"
                                                        onClick={() => handleActualizarEstado(cot.cotizacion_id, "aprobar")}
                                                    >
                                                        <span className="material-symbols-outlined">check</span>
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-act-table danger"
                                                        onClick={() => handleActualizarEstado(cot.cotizacion_id, "rechazar")}
                                                    >
                                                        <span className="material-symbols-outlined">close</span>
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                type="button"
                                                className="btn-act-table link"
                                                disabled={cot.estado !== "Aprobada"}
                                                onClick={() => handleFacturar(cot)}
                                                title={cot.estado === "Aprobada" ? "Generar factura desde esta cotización" : "Debe estar aprobada para facturar"}
                                            >
                                                <span className="material-symbols-outlined">receipt_long</span>
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

