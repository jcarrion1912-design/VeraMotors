import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import {
    obtenerCotizaciones,
    obtenerCotizacion,
    crearCotizacion,
    actualizarCotizacion,
    aprobarCotizacion,
    rechazarCotizacion
} from "../../services/cotizacionesService";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerVehiculosCliente } from "../../services/citaService";
import { obtenerInventario } from "../../services/inventarioService";
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

const redondear = (valor) => Number(Number(valor || 0).toFixed(2));

const calcularLinea = (item) => {
    const bruto = Number(item.cantidad) * Number(item.precio_unitario);
    const descuento = Number(item.descuento || 0);
    const base = bruto - descuento;
    const impuesto = item.impuesto_porcentaje != null
        ? redondear(base * Number(item.impuesto_porcentaje) / 100)
        : Number(item.impuesto || 0);

    return {
        bruto: redondear(bruto),
        descuento: redondear(descuento),
        impuesto,
        total: redondear(base + impuesto)
    };
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
    const [productosInventario, setProductosInventario] = useState([]);
    const [vehiculosCliente, setVehiculosCliente] = useState([]);
    const [cotizacionCliente, setCotizacionCliente] = useState("");
    const [cotizacionVehiculo, setCotizacionVehiculo] = useState("");
    const [itemsCotizacion, setItemsCotizacion] = useState([]);
    const [productoInventarioId, setProductoInventarioId] = useState("");
    const [cotizacionEditandoId, setCotizacionEditandoId] = useState(null);
    const [cotizacionExpandidaId, setCotizacionExpandidaId] = useState(null);

    const [nuevoItemDesc, setNuevoItemDesc] = useState("");
    const [nuevoItemPrecio, setNuevoItemPrecio] = useState("");
    const [nuevoItemCantidad, setNuevoItemCantidad] = useState(1);
    const [nuevoItemDescuento, setNuevoItemDescuento] = useState(0);

    const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);
    const [cargandoInventario, setCargandoInventario] = useState(false);

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

    const cargarInventario = async () => {
        try {
            setCargandoInventario(true);
            const data = await obtenerInventario();
            setProductosInventario(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando inventario para cotizaciones:", error);
            setProductosInventario([]);
            alert(error.message || "No se pudo cargar el inventario.");
        } finally {
            setCargandoInventario(false);
        }
    };

    useEffect(() => {
        cargarCotizaciones();
        cargarClientes();
        cargarInventario();
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
        setCotizacionEditandoId(null);
        setCotizacionCliente("");
        setCotizacionVehiculo("");
        setItemsCotizacion([]);
        setProductoInventarioId("");
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
    const totalesCotizacion = itemsCotizacion.reduce(
        (totales, item) => {
            const linea = calcularLinea(item);
            return {
                subtotal: totales.subtotal + linea.bruto,
                descuentos: totales.descuentos + linea.descuento,
                impuestos: totales.impuestos + linea.impuesto,
                total: totales.total + linea.total
            };
        },
        { subtotal: 0, descuentos: 0, impuestos: 0, total: 0 }
    );
    const totalCotizacion = redondear(totalesCotizacion.total);

    const agregarProductoInventario = () => {
        const producto = productosInventario.find(
            (item) => String(item.item_id) === productoInventarioId
        );
        if (!producto) {
            alert("Selecciona un producto del inventario.");
            return;
        }
        if (itemsCotizacion.some((item) => Number(item.item_id) === Number(producto.item_id))) {
            alert("Ese producto ya está agregado a la cotización.");
            return;
        }
        setItemsCotizacion((prev) => [
            ...prev,
            {
                id: `inventario-${producto.item_id}`,
                item_id: producto.item_id,
                item_codigo: producto.codigo_referencia,
                descripcion: producto.nombre_nomenclatura,
                cantidad: 1,
                precio_unitario: Number(producto.precio_venta || 0),
                descuento: 0,
                impuesto_porcentaje: Number(producto.impuesto || 0)
            }
        ]);
        setProductoInventarioId("");
    };

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
            descuento: Number(nuevoItemDescuento) || 0,
            impuesto_porcentaje: 18
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

    const actualizarItem = (id, campo, valor) => {
        setItemsCotizacion((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [campo]: Number(valor) } : item
            )
        );
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
            const detalleCalculado = itemsCotizacion.map((item) => ({
                ...calcularLinea(item),
                item
            }));
            const subtotal = redondear(
                detalleCalculado.reduce((acum, linea) => acum + linea.bruto, 0)
            );
            const descuentos = redondear(
                detalleCalculado.reduce((acum, linea) => acum + linea.descuento, 0)
            );
            const impuestos = redondear(
                detalleCalculado.reduce((acum, linea) => acum + linea.impuesto, 0)
            );
            const total = redondear(
                detalleCalculado.reduce((acum, linea) => acum + linea.total, 0)
            );

            const payload = {
                cliente_id: Number(cotizacionCliente),
                vehiculo_id: Number(cotizacionVehiculo),
                subtotal,
                descuentos,
                impuestos,
                total,
                detalles: detalleCalculado.map(({ item, impuesto, total: totalLinea }) => {
                    return {
                        item_id: item.item_id ? Number(item.item_id) : null,
                        descripcion: item.descripcion,
                        cantidad: Number(item.cantidad),
                        precio_unitario: Number(item.precio_unitario),
                        descuento: Number(item.descuento || 0),
                        impuesto,
                        total: totalLinea
                    };
                })
            };

            if (cotizacionEditandoId) {
                await actualizarCotizacion(cotizacionEditandoId, payload);
                alert("Cotización actualizada correctamente.");
            } else {
                await crearCotizacion(payload);
                alert("Cotización registrada correctamente.");
            }
            setMostrarModal(false);
            setCotizacionEditandoId(null);
            await cargarCotizaciones();
        } catch (error) {
            console.error("Error registrando cotización:", error);
            alert(error.message || "Ocurrió un error al registrar la cotización.");
        } finally {
            setGuardandoCotizacion(false);
        }
    };

    const abrirEdicion = async (cotizacion) => {
        if (!cotizacion.detalles?.length) {
            try {
                const actualizada = await obtenerCotizacion(cotizacion.cotizacion_id);
                cotizacion = actualizada;
            } catch (error) {
                alert(error.message || "No se pudo cargar el detalle de la cotización.");
                return;
            }
        }

        setCotizacionEditandoId(cotizacion.cotizacion_id);
        setCotizacionCliente(String(cotizacion.cliente_id));
        setCotizacionVehiculo(String(cotizacion.vehiculo_id));
        setItemsCotizacion((cotizacion.detalles || []).map((detalle) => {
            const base = Number(detalle.cantidad) * Number(detalle.precio_unitario)
                - Number(detalle.descuento || 0);
            return {
                id: detalle.detalle_cotizacion_id,
                item_id: detalle.item_id,
                item_codigo: detalle.item_codigo,
                descripcion: detalle.descripcion,
                cantidad: Number(detalle.cantidad),
                precio_unitario: Number(detalle.precio_unitario),
                descuento: Number(detalle.descuento || 0),
                impuesto: Number(detalle.impuesto || 0),
                impuesto_porcentaje: base > 0
                    ? redondear(Number(detalle.impuesto || 0) * 100 / base)
                    : 0
            };
        }));
        setProductoInventarioId("");
        setNuevoItemDesc("");
        setNuevoItemPrecio("");
        setNuevoItemCantidad(1);
        setNuevoItemDescuento(0);
        setMostrarModal(true);
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
                            <h3>{cotizacionEditandoId ? "Editar cotización" : "Registrar nueva cotización"}</h3>
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
                                <div className="form-group cot-producto-inventario">
                                    <label htmlFor="cotizacion-producto">Producto de inventario</label>
                                    <div className="cot-producto-selector">
                                        <select
                                            id="cotizacion-producto"
                                            value={productoInventarioId}
                                            onChange={(event) => setProductoInventarioId(event.target.value)}
                                            disabled={cargandoInventario || productosInventario.length === 0}
                                        >
                                            <option value="">
                                                {cargandoInventario
                                                    ? "Cargando productos..."
                                                    : "Selecciona un producto"}
                                            </option>
                                            {productosInventario.map((producto) => (
                                                <option key={producto.item_id} value={producto.item_id}>
                                                    {producto.codigo_referencia} · {producto.nombre_nomenclatura}
                                                    {" · "}{moneda(producto.precio_venta)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="vm-btn vm-btn-primary"
                                            onClick={agregarProductoInventario}
                                            disabled={!productoInventarioId}
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                            Agregar producto
                                        </button>
                                    </div>
                                </div>
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
                                                    const linea = calcularLinea(item);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>
                                                                {item.item_codigo && <span className="vm-code">{item.item_codigo} · </span>}
                                                                {item.descripcion}
                                                            </td>
                                                            <td className="vm-num">
                                                                <input
                                                                    className="cot-linea-numero"
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    value={item.cantidad}
                                                                    onChange={(event) => actualizarItem(item.id, "cantidad", event.target.value)}
                                                                    aria-label={`Cantidad de ${item.descripcion}`}
                                                                />
                                                            </td>
                                                            <td className="vm-num">
                                                                <input
                                                                    className="cot-linea-numero"
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.precio_unitario}
                                                                    onChange={(event) => actualizarItem(item.id, "precio_unitario", event.target.value)}
                                                                    aria-label={`Precio unitario de ${item.descripcion}`}
                                                                />
                                                            </td>
                                                            <td className="vm-num">{moneda(item.descuento || 0)}</td>
                                                            <td className="vm-num"><strong>{moneda(linea.total)}</strong></td>
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
                                <span>
                                    Subtotal {moneda(totalesCotizacion.subtotal)}
                                    {" · "}Descuentos {moneda(totalesCotizacion.descuentos)}
                                    {" · "}Impuestos {moneda(totalesCotizacion.impuestos)}
                                    {" · "}Total cotización
                                </span>
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
                                <Fragment key={cot.cotizacion_id}>
                                <tr>
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
                                            <button
                                                type="button"
                                                className="btn-act-table link"
                                                onClick={() => setCotizacionExpandidaId(
                                                    cotizacionExpandidaId === cot.cotizacion_id
                                                        ? null
                                                        : cot.cotizacion_id
                                                )}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {cotizacionExpandidaId === cot.cotizacion_id ? "expand_less" : "list"}
                                                </span>
                                                Productos
                                            </button>
                                            {cot.estado === "Pendiente" && (
                                                <button
                                                    type="button"
                                                    className="btn-act-table link"
                                                    onClick={() => abrirEdicion(cot)}
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                    Editar
                                                </button>
                                            )}
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
                                {cotizacionExpandidaId === cot.cotizacion_id && (
                                    <tr key={`${cot.cotizacion_id}-detalles`}>
                                        <td colSpan="9">
                                            {cot.detalles?.length ? (
                                                <div className="cot-detalles-lista">
                                                    {cot.detalles.map((detalle) => (
                                                        <div key={detalle.detalle_cotizacion_id}>
                                                            <span>
                                                                {detalle.item_codigo
                                                                    ? `${detalle.item_codigo} · `
                                                                    : ""}
                                                                {detalle.item_nombre || detalle.descripcion}
                                                            </span>
                                                            <span>
                                                                {detalle.cantidad} × {moneda(detalle.precio_unitario)}
                                                            </span>
                                                            <span>Subtotal {moneda(Number(detalle.cantidad) * Number(detalle.precio_unitario))}</span>
                                                            <span>Impuesto {moneda(detalle.impuesto)}</span>
                                                            <strong>{moneda(detalle.total)}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="cot-detalles-lista">Sin productos o servicios registrados.</div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Cotizaciones;
