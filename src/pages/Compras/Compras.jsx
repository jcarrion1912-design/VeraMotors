import { useCallback, useEffect, useMemo, useState } from "react";
import "./Compras.css";
import { obtenerCompras, crearCompra } from "../../services/comprasService";
import { obtenerRecepciones, crearRecepcion } from "../../services/recepcionesService";
import { obtenerProveedores } from "../../services/proveedoresService";
import { obtenerInventario } from "../../services/inventarioService";
import { useRole } from "../../context/authContext";

const SUBMENUS_COMPRAS = [
    "Órdenes de Compra",
    "Recepciones de Almacén",
    "Facturas de Proveedor"
];

const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

const formatoMonto = (valor) => Number(valor || 0).toFixed(2);

function Compras() {
    const { usuarioActual } = useRole();
    const [submodulo, setSubmodulo] = useState("Órdenes de Compra");
    const [estadoFiltro, setEstadoFiltro] = useState("Todos");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState("");
    const [proveedorSel, setProveedorSel] = useState("");
    const [ordenesCompra, setOrdenesCompra] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [recepciones, setRecepciones] = useState([]);

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true);
            setErrorCarga("");
            const [compras, provs, inventario, recepcionesData] = await Promise.all([
                obtenerCompras(),
                obtenerProveedores(),
                obtenerInventario(),
                obtenerRecepciones()
            ]);
            setOrdenesCompra(Array.isArray(compras) ? compras : []);
            setProveedores(Array.isArray(provs) ? provs : []);
            setArticulos(Array.isArray(inventario) ? inventario : []);
            setRecepciones(Array.isArray(recepcionesData) ? recepcionesData : []);
            setProveedorSel((actual) => actual || String(provs[0]?.proveedor_id || ""));
        } catch (error) {
            console.error("Error cargando compras, inventario y recepciones:", error);
            setErrorCarga(error.message || "No se pudieron cargar las compras y recepciones.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargarDatos();
    }, [cargarDatos]);

    const [itemsCompra, setItemsCompra] = useState([]);
    const [articuloSel, setArticuloSel] = useState("");
    const [cantidadItem, setCantidadItem] = useState("1");
    const [precioItem, setPrecioItem] = useState("");
    const [descuentoItem, setDescuentoItem] = useState("0");
    const [impuestoItem, setImpuestoItem] = useState("18");
    const [busquedaArticulo, setBusquedaArticulo] = useState("");
    const [guardandoCompra, setGuardandoCompra] = useState(false);

    const [compraRecepcion, setCompraRecepcion] = useState(null);
    const [cantidadesRecepcion, setCantidadesRecepcion] = useState({});
    const [recepcionBorradorId, setRecepcionBorradorId] = useState(null);
    const [observacionesRecepcion, setObservacionesRecepcion] = useState("");
    const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);

    const articuloSeleccionado = articulos.find(
        (articulo) => String(articulo.item_id) === articuloSel
    );

    const subtotalBruto = itemsCompra.reduce(
        (total, item) => total + item.cantidad * item.precio_unitario,
        0
    );
    const totalDescuentos = itemsCompra.reduce((total, item) => total + item.descuento, 0);
    const totalImpuestos = itemsCompra.reduce((total, item) => total + item.impuesto, 0);
    const totalCompra = subtotalBruto - totalDescuentos + totalImpuestos;

    const ordenesFiltradas = useMemo(
        () => ordenesCompra.filter((orden) =>
            estadoFiltro === "Todos" || orden.estado === estadoFiltro
        ),
        [estadoFiltro, ordenesCompra]
    );

    const obtenerDetalleAgrupado = (compra) => {
        const agrupados = new Map();
        (compra.detalles || []).forEach((detalle) => {
            const itemId = Number(detalle.item_id);
            const actual = agrupados.get(itemId) || {
                item_id: itemId,
                item: detalle.item,
                cantidad: 0
            };
            actual.cantidad += Number(detalle.cantidad || 0);
            agrupados.set(itemId, actual);
        });
        return [...agrupados.values()];
    };

    const obtenerCantidadRecibida = (compraId, itemId) => recepciones
        .filter((recepcion) =>
            Number(recepcion.compra_id) === Number(compraId) &&
            recepcion.estado === "Confirmada"
        )
        .flatMap((recepcion) => recepcion.detalles || [])
        .filter((detalle) => Number(detalle.item_id) === Number(itemId))
        .reduce((total, detalle) => total + Number(detalle.cantidad_recibida || 0), 0);

    const obtenerPendiente = (compra, itemId) => {
        const ordenado = obtenerDetalleAgrupado(compra)
            .find((detalle) => detalle.item_id === Number(itemId))?.cantidad || 0;
        return Math.max(0, redondear(ordenado - obtenerCantidadRecibida(compra.compra_id, itemId)));
    };

    const obtenerBorrador = (compraId) => recepciones.find((recepcion) =>
        Number(recepcion.compra_id) === Number(compraId) && recepcion.estado === "Registrada"
    );

    const abrirModalCompra = () => {
        setItemsCompra([]);
        setArticuloSel("");
        setCantidadItem("1");
        setPrecioItem("");
        setDescuentoItem("0");
        setImpuestoItem("18");
        setBusquedaArticulo("");
        setMostrarModal(true);
    };

    const seleccionarArticulo = (itemId) => {
        setArticuloSel(itemId);
        const articulo = articulos.find((item) => String(item.item_id) === itemId);
        setPrecioItem(articulo ? String(articulo.costo_compra || 0) : "");
        setImpuestoItem(articulo ? String(articulo.impuesto ?? 18) : "18");
    };

    const agregarArticuloCompra = () => {
        const cantidad = Number(cantidadItem);
        const precioUnitario = Number(precioItem);
        const descuento = Number(descuentoItem);
        const tasaImpuesto = Number(impuestoItem);
        if (!articuloSeleccionado || !Number.isFinite(cantidad) || cantidad <= 0 ||
            !Number.isFinite(precioUnitario) || precioUnitario < 0 ||
            !Number.isFinite(descuento) || descuento < 0 ||
            !Number.isFinite(tasaImpuesto) || tasaImpuesto < 0) {
            alert("Selecciona un artículo y verifica cantidad, precio, descuento e impuesto.");
            return;
        }
        if (itemsCompra.some((item) => item.item_id === articuloSeleccionado.item_id)) {
            alert("Ese artículo ya está agregado a la orden de compra.");
            return;
        }

        const importeBruto = redondear(cantidad * precioUnitario);
        if (descuento > importeBruto) {
            alert("El descuento no puede superar el importe bruto del artículo.");
            return;
        }
        const impuesto = redondear((importeBruto - descuento) * tasaImpuesto / 100);
        setItemsCompra((actuales) => [
            ...actuales,
            {
                item_id: articuloSeleccionado.item_id,
                codigo: articuloSeleccionado.codigo_referencia,
                nombre: articuloSeleccionado.nombre_nomenclatura,
                marca: articuloSeleccionado.marca || "",
                stock: Number(articuloSeleccionado.stock_actual || 0),
                cantidad,
                precio_unitario: redondear(precioUnitario),
                descuento: redondear(descuento),
                impuesto,
                tasaImpuesto
            }
        ]);
        setArticuloSel("");
        setCantidadItem("1");
        setPrecioItem("");
        setDescuentoItem("0");
        setImpuestoItem("18");
        setBusquedaArticulo("");
    };

    const emitirOrdenCompra = async (event) => {
        event.preventDefault();
        if (!usuarioActual?.user_id) {
            alert("Inicia sesión para registrar la compra.");
            return;
        }
        if (!proveedorSel || itemsCompra.length === 0) {
            alert("Selecciona un proveedor y agrega al menos un artículo del inventario.");
            return;
        }

        try {
            setGuardandoCompra(true);
            await crearCompra({
                proveedor_id: Number(proveedorSel),
                usuario_id: usuarioActual.user_id,
                subtotal: redondear(subtotalBruto),
                impuestos: redondear(totalImpuestos),
                descuentos: redondear(totalDescuentos),
                total: redondear(totalCompra),
                estado: "Registrada",
                detalles: itemsCompra.map((item) => ({
                    item_id: item.item_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento: item.descuento,
                    impuesto: item.impuesto,
                    total: redondear(
                        item.cantidad * item.precio_unitario - item.descuento + item.impuesto
                    )
                }))
            });
            setMostrarModal(false);
            setItemsCompra([]);
            await cargarDatos();
            alert("Orden de compra registrada con los artículos seleccionados.");
        } catch (error) {
            console.error("Error registrando compra:", error);
            alert(error.message || "No se pudo registrar la orden de compra.");
        } finally {
            setGuardandoCompra(false);
        }
    };

    const abrirRecepcion = (compra) => {
        const borrador = obtenerBorrador(compra.compra_id);
        setCompraRecepcion(compra);
        setRecepcionBorradorId(borrador?.recepcion_id || null);
        setObservacionesRecepcion(borrador?.observaciones || "");
        const cantidades = {};
        obtenerDetalleAgrupado(compra).forEach((detalle) => {
            const lineaBorrador = borrador?.detalles?.find(
                (linea) => Number(linea.item_id) === detalle.item_id
            );
            cantidades[detalle.item_id] = lineaBorrador
                ? String(lineaBorrador.cantidad_recibida)
                : borrador
                    ? "0"
                    : String(obtenerPendiente(compra, detalle.item_id));
        });
        setCantidadesRecepcion(cantidades);
    };

    const guardarRecepcion = async (event) => {
        event.preventDefault();
        if (!usuarioActual?.user_id || !compraRecepcion) {
            alert("Inicia sesión para registrar la recepción.");
            return;
        }

        try {
            setGuardandoRecepcion(true);
            let idBorrador = recepcionBorradorId;
            if (!idBorrador) {
                const detalles = obtenerDetalleAgrupado(compraRecepcion)
                    .map((detalle) => ({
                        item_id: detalle.item_id,
                        descripcion: detalle.item?.nombre_nomenclatura || `Artículo ${detalle.item_id}`,
                        cantidad_ordenada: detalle.cantidad,
                        cantidad_recibida: Number(cantidadesRecepcion[detalle.item_id] || 0),
                        cantidad_pendiente: 0,
                        precio_unitario: 0,
                        total: 0
                    }))
                    .filter((detalle) => detalle.cantidad_recibida > 0);

                if (!detalles.length) {
                    throw new Error("Indica una cantidad recibida para al menos un artículo.");
                }
                for (const detalle of detalles) {
                    const pendiente = obtenerPendiente(compraRecepcion, detalle.item_id);
                    if (detalle.cantidad_recibida > pendiente) {
                        throw new Error(`La cantidad recibida supera el pendiente del artículo ${detalle.item_id} (${pendiente}).`);
                    }
                }

                const borrador = await crearRecepcion({
                    compra_id: compraRecepcion.compra_id,
                    proveedor_id: compraRecepcion.proveedor_id,
                    usuario_id: usuarioActual.user_id,
                    observaciones: observacionesRecepcion.trim() || null,
                    confirmar: false,
                    detalles
                });
                idBorrador = borrador.recepcion_id;
                setRecepcionBorradorId(idBorrador);
                setRecepciones((actuales) => [borrador, ...actuales]);
            }

            await crearRecepcion({
                recepcion_id: idBorrador,
                usuario_id: usuarioActual.user_id,
                confirmar: true
            });
            setCompraRecepcion(null);
            setRecepcionBorradorId(null);
            await cargarDatos();
            alert("Recepción confirmada. El stock y el movimiento de entrada fueron actualizados.");
        } catch (error) {
            console.error("Error confirmando recepción:", error);
            alert(error.message || "No se pudo confirmar la recepción. Si ya hay un borrador, puedes reintentar sin duplicar la entrada.");
        } finally {
            setGuardandoRecepcion(false);
        }
    };

    const articulosFiltrados = articulos.filter((articulo) => {
        const termino = busquedaArticulo.trim().toLowerCase();
        if (!termino) return true;
        return [
            articulo.codigo_referencia,
            articulo.nombre_nomenclatura,
            articulo.marca
        ].some((valor) => String(valor || "").toLowerCase().includes(termino));
    });

    const totalOrdenado = (compra) => obtenerDetalleAgrupado(compra)
        .reduce((total, detalle) => total + detalle.cantidad, 0);
    const totalRecibido = (compra) => obtenerDetalleAgrupado(compra)
        .reduce((total, detalle) => total + obtenerCantidadRecibida(compra.compra_id, detalle.item_id), 0);

    return (
        <div className="compras-page">
            {cargando && <p role="status">Consultando compras, inventario y recepciones…</p>}
            {errorCarga && <p role="alert">{errorCarga}</p>}

            <div className="compras-header">
                <div>
                    <h2>Gestión de Compras y Abastecimiento</h2>
                    <p>Órdenes de compra a proveedores y recepciones de artículos del inventario.</p>
                </div>
                <button className="btn-nueva-compra" onClick={abrirModalCompra} type="button">
                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                    + Nueva Orden de Compra
                </button>
            </div>

            <div className="reportes-tabs-nav" style={{ marginBottom: "16px" }}>
                {SUBMENUS_COMPRAS.map((tab) => (
                    <button
                        key={tab}
                        className={`reportes-tab-btn ${submodulo === tab ? "active" : ""}`}
                        onClick={() => setSubmodulo(tab)}
                        type="button"
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {submodulo !== "Facturas de Proveedor" && (
                <div className="os-filter-bar" style={{ marginBottom: "20px" }}>
                    <label htmlFor="filtro-estado-compra" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>
                        Filtrar por Estado:
                    </label>
                    <select
                        id="filtro-estado-compra"
                        value={estadoFiltro}
                        onChange={(event) => setEstadoFiltro(event.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Solicitado">Solicitado</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Registrada">Registrada</option>
                        <option value="Parcial">Parcialmente recibida</option>
                        <option value="Recibida">Recibida en Almacén</option>
                        <option value="Pagado">Pagado</option>
                    </select>
                </div>
            )}

            {submodulo === "Órdenes de Compra" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Fecha Emisión</th>
                                <th>Artículos</th>
                                <th>Subtotal</th>
                                <th>Impuestos</th>
                                <th>Total ODC (S/)</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesFiltradas.map((orden) => (
                                <tr key={orden.compra_id}>
                                    <td><strong>{orden.codigo_compra}</strong></td>
                                    <td>{proveedores.find((proveedor) => Number(proveedor.proveedor_id) === Number(orden.proveedor_id))?.razon_social || "Proveedor"}</td>
                                    <td>{new Date(orden.fecha_compra).toLocaleDateString()}</td>
                                    <td>{(orden.detalles || []).length}</td>
                                    <td>S/ {formatoMonto(orden.subtotal)}</td>
                                    <td>S/ {formatoMonto(orden.impuestos)}</td>
                                    <td><strong>S/ {formatoMonto(orden.total)}</strong></td>
                                    <td><span className={`proc-tag ${orden.estado === "Recibida" ? "preventivo" : orden.estado === "Registrada" ? "link" : "correctivo"}`}>{orden.estado}</span></td>
                                    <td>
                                        <button className="btn-act-table link" type="button">
                                            📄 ODC PDF
                                        </button>
                                        <button
                                            className="btn-act-table nps"
                                            onClick={() => abrirRecepcion(orden)}
                                            type="button"
                                            disabled={!obtenerBorrador(orden.compra_id) && !obtenerDetalleAgrupado(orden).some((detalle) => obtenerPendiente(orden, detalle.item_id) > 0)}
                                        >
                                            📦 Recibir en almacén
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {submodulo === "Recepciones de Almacén" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Artículos ordenados</th>
                                <th>Artículos recibidos</th>
                                <th>Recepción pendiente</th>
                                <th>Estado ODC</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesFiltradas.map((orden) => {
                                const tienePendiente = obtenerDetalleAgrupado(orden).some(
                                    (detalle) => obtenerPendiente(orden, detalle.item_id) > 0
                                );
                                return (
                                    <tr key={orden.compra_id}>
                                        <td><strong>{orden.codigo_compra}</strong></td>
                                        <td>{proveedores.find((proveedor) => Number(proveedor.proveedor_id) === Number(orden.proveedor_id))?.razon_social || "Proveedor"}</td>
                                        <td>{formatoMonto(totalOrdenado(orden))}</td>
                                        <td>{formatoMonto(totalRecibido(orden))}</td>
                                        <td>{obtenerBorrador(orden.compra_id) ? "Borrador por confirmar" : tienePendiente ? "Sí" : "No"}</td>
                                        <td>{orden.estado}</td>
                                        <td>
                                            <button
                                                className="btn-act-table nps"
                                                onClick={() => abrirRecepcion(orden)}
                                                type="button"
                                                disabled={!tienePendiente && !obtenerBorrador(orden.compra_id)}
                                            >
                                                {obtenerBorrador(orden.compra_id) ? "Confirmar borrador" : "Abrir ODC"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <h3 style={{ margin: "20px 0 10px" }}>Historial de recepciones</h3>
                    <table className="os-table">
                        <thead>
                            <tr>
                                <th>Recepción</th>
                                <th>ODC</th>
                                <th>Fecha</th>
                                <th>Artículos</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recepciones.map((recepcion) => (
                                <tr key={recepcion.recepcion_id}>
                                    <td>Recepción-{recepcion.recepcion_id}</td>
                                    <td>{ordenesCompra.find((orden) => Number(orden.compra_id) === Number(recepcion.compra_id))?.codigo_compra || recepcion.compra_id}</td>
                                    <td>{new Date(recepcion.fecha_recepcion).toLocaleString()}</td>
                                    <td>{(recepcion.detalles || []).map((detalle) => `${detalle.descripcion}: ${detalle.cantidad_recibida}`).join(", ") || "—"}</td>
                                    <td>{recepcion.estado}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {submodulo === "Facturas de Proveedor" && (
                <div style={{ background: "#ffffff", padding: "40px", textAlign: "center", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                    <h3>Módulo de Facturas de Proveedor</h3>
                    <p>La gestión de facturas de proveedor continúa disponible en su módulo.</p>
                </div>
            )}

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal" style={{ maxWidth: "900px" }}>
                        <div className="modal-header">
                            <div>
                                <h2>Nueva Orden de Compra (ODC)</h2>
                                <p>Selecciona artículos existentes del catálogo maestro de Inventario.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModal(false)} type="button">✕</button>
                        </div>
                        <form onSubmit={emitirOrdenCompra}>
                            <div className="modal-body">
                                <div style={{ marginBottom: "14px" }}>
                                    <label htmlFor="proveedor-odc" style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Proveedor Homologado *</label>
                                    <select id="proveedor-odc" value={proveedorSel} onChange={(event) => setProveedorSel(event.target.value)} required>
                                        <option value="">Selecciona proveedor</option>
                                        {proveedores.map((proveedor) => (
                                            <option key={proveedor.proveedor_id} value={proveedor.proveedor_id}>{proveedor.razon_social}</option>
                                        ))}
                                    </select>
                                </div>

                                <h4>Artículos requeridos</h4>
                                <div style={{ overflowX: "auto" }}>
                                    <table className="os-table" style={{ marginBottom: "12px" }}>
                                        <thead>
                                            <tr>
                                                <th>Código / Artículo</th>
                                                <th>Marca</th>
                                                <th>Stock actual</th>
                                                <th>Cantidad</th>
                                                <th>Precio unitario</th>
                                                <th>Descuento</th>
                                                <th>Impuesto</th>
                                                <th>Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsCompra.map((item) => (
                                                <tr key={item.item_id}>
                                                    <td>{item.codigo} — {item.nombre}</td>
                                                    <td>{item.marca || "—"}</td>
                                                    <td>{formatoMonto(item.stock)}</td>
                                                    <td>{formatoMonto(item.cantidad)}</td>
                                                    <td>S/ {formatoMonto(item.precio_unitario)}</td>
                                                    <td>S/ {formatoMonto(item.descuento)}</td>
                                                    <td>S/ {formatoMonto(item.impuesto)} ({formatoMonto(item.tasaImpuesto)}%)</td>
                                                    <td>S/ {formatoMonto(item.cantidad * item.precio_unitario - item.descuento + item.impuesto)}</td>
                                                    <td>
                                                        <button type="button" className="btn-act-table btn-reject" onClick={() => setItemsCompra((actuales) => actuales.filter((actual) => actual.item_id !== item.item_id))}>Quitar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {itemsCompra.length === 0 && <tr><td colSpan="9">Agrega artículos existentes para continuar.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) repeat(4, minmax(100px, 1fr)) auto", gap: "8px", alignItems: "end", marginBottom: "16px" }}>
                                    <div>
                                        <label htmlFor="buscar-articulo">Buscar artículo</label>
                                        <input id="buscar-articulo" value={busquedaArticulo} onChange={(event) => setBusquedaArticulo(event.target.value)} placeholder="Código, nombre o marca" />
                                        <select value={articuloSel} onChange={(event) => seleccionarArticulo(event.target.value)}>
                                            <option value="">Selecciona artículo</option>
                                            {articulosFiltrados.map((articulo) => (
                                                <option key={articulo.item_id} value={articulo.item_id}>
                                                    {articulo.codigo_referencia} — {articulo.nombre_nomenclatura} — {articulo.marca || "Sin marca"} (stock {formatoMonto(articulo.stock_actual)})
                                                </option>
                                            ))}
                                        </select>
                                        {articuloSeleccionado && (
                                            <small>
                                                {articuloSeleccionado.codigo_referencia} · {articuloSeleccionado.nombre_nomenclatura} · {articuloSeleccionado.marca || "Sin marca"} · Stock: {formatoMonto(articuloSeleccionado.stock_actual)}
                                            </small>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="cantidad-odc">Cantidad</label>
                                        <input id="cantidad-odc" type="number" min="0.01" step="0.01" value={cantidadItem} onChange={(event) => setCantidadItem(event.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="precio-odc">Precio unitario</label>
                                        <input id="precio-odc" type="number" min="0" step="0.01" value={precioItem} onChange={(event) => setPrecioItem(event.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="descuento-odc">Descuento (S/)</label>
                                        <input id="descuento-odc" type="number" min="0" step="0.01" value={descuentoItem} onChange={(event) => setDescuentoItem(event.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="impuesto-odc">Impuesto (%)</label>
                                        <input id="impuesto-odc" type="number" min="0" step="0.01" value={impuestoItem} onChange={(event) => setImpuestoItem(event.target.value)} />
                                    </div>
                                    <button type="button" className="btn-act-table link" onClick={agregarArticuloCompra}>+ Añadir</button>
                                </div>

                                <div style={{ background: "#f1f5f9", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal bruto:</span><span>S/ {formatoMonto(subtotalBruto)}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Descuentos:</span><span>S/ {formatoMonto(totalDescuentos)}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Impuestos:</span><span>S/ {formatoMonto(totalImpuestos)}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Total ODC:</span><span>S/ {formatoMonto(totalCompra)}</span></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)} disabled={guardandoCompra}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardandoCompra || !itemsCompra.length}>{guardandoCompra ? "Guardando…" : "Emitir Orden de Compra"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {compraRecepcion && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal" style={{ maxWidth: "850px" }}>
                        <div className="modal-header">
                            <div>
                                <h2>Recepción de {compraRecepcion.codigo_compra}</h2>
                                <p>Ingresa la cantidad entregada por el proveedor. No se puede exceder el saldo pendiente.</p>
                            </div>
                            <button className="btn-close" onClick={() => setCompraRecepcion(null)} type="button" disabled={guardandoRecepcion}>✕</button>
                        </div>
                        <form onSubmit={guardarRecepcion}>
                            <div className="modal-body">
                                <table className="os-table">
                                    <thead>
                                        <tr>
                                            <th>Artículo</th>
                                            <th>Ordenado</th>
                                            <th>Recibido</th>
                                            <th>Pendiente</th>
                                            <th>Recibir ahora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {obtenerDetalleAgrupado(compraRecepcion).map((detalle) => {
                                            const recibido = obtenerCantidadRecibida(compraRecepcion.compra_id, detalle.item_id);
                                            const pendiente = obtenerPendiente(compraRecepcion, detalle.item_id);
                                            return (
                                                <tr key={detalle.item_id}>
                                                    <td>
                                                        <strong>{detalle.item?.codigo_referencia || detalle.item_id} — {detalle.item?.nombre_nomenclatura || "Artículo"}</strong>
                                                        <br />{detalle.item?.marca || "Sin marca"} · Stock actual: {formatoMonto(detalle.item?.stock_actual)}
                                                    </td>
                                                    <td>{formatoMonto(detalle.cantidad)}</td>
                                                    <td>{formatoMonto(recibido)}</td>
                                                    <td>{formatoMonto(pendiente)}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={pendiente}
                                                            step="0.01"
                                                            value={cantidadesRecepcion[detalle.item_id] || "0"}
                                                            onChange={(event) => setCantidadesRecepcion((actuales) => ({ ...actuales, [detalle.item_id]: event.target.value }))}
                                                            disabled={Boolean(recepcionBorradorId) || pendiente <= 0}
                                                            aria-label={`Cantidad recibida de ${detalle.item?.nombre_nomenclatura || detalle.item_id}`}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <label htmlFor="observaciones-recepcion">Observaciones</label>
                                <textarea id="observaciones-recepcion" value={observacionesRecepcion} onChange={(event) => setObservacionesRecepcion(event.target.value)} rows="3" disabled={Boolean(recepcionBorradorId)} />
                                {recepcionBorradorId && <p role="status">Existe un borrador. Al reintentar se confirmará el mismo registro sin duplicar movimientos.</p>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setCompraRecepcion(null)} disabled={guardandoRecepcion}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardandoRecepcion || !obtenerDetalleAgrupado(compraRecepcion).some((detalle) => obtenerPendiente(compraRecepcion, detalle.item_id) > 0)}>
                                    {guardandoRecepcion ? "Confirmando…" : "Confirmar recepción"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Compras;
