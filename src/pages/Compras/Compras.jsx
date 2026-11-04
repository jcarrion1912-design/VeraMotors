import { useCallback, useEffect, useMemo, useState } from "react";
import "./Compras.css";
<<<<<<< HEAD
import { obtenerCompras, crearCompra } from "../../services/comprasService";
import { obtenerRecepciones, crearRecepcion } from "../../services/recepcionesService";
=======
import {
    obtenerCompras,
    crearCompra,
    obtenerDetallesCompra,
    obtenerRecepciones,
    registrarRecepcion
} from "../../services/comprasService";
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
import { obtenerProveedores } from "../../services/proveedoresService";
import { obtenerInventario } from "../../services/inventarioService";
import { useRole } from "../../context/authContext";
import { imprimirOrdenCompra } from "./imprimirOrdenCompra";
import FacturasProveedor from "./FacturasProveedor";

const SUBMENUS_COMPRAS = [
    "Órdenes de Compra",
    "Recepciones de Almacén",
    "Facturas de Proveedor"
];

<<<<<<< HEAD
const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

const formatoMonto = (valor) => Number(valor || 0).toFixed(2);
=======
const TASA_IGV = 0.18;
const ESTADOS_COMPRA = ["Registrada", "Recibida"];
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab

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
<<<<<<< HEAD
    const [articulos, setArticulos] = useState([]);
=======
    const [itemsInventario, setItemsInventario] = useState([]);
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
    const [recepciones, setRecepciones] = useState([]);

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true);
<<<<<<< HEAD
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
=======
            const [compras, provs, inventario, recepcionesData] = await Promise.all([
                obtenerCompras(),
                obtenerProveedores(),
                obtenerInventario().catch(() => []),
                obtenerRecepciones().catch(() => [])
            ]);
            setOrdenesCompra(compras);
            setProveedores(provs);
            setItemsInventario(Array.isArray(inventario) ? inventario.filter((i) => i.activo && i.tipo !== "Servicio") : []);
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
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
<<<<<<< HEAD
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

=======
    const [itemIdSel, setItemIdSel] = useState("");
    const [itemCant, setItemCant] = useState("");
    const [itemCosto, setItemCosto] = useState("");

    const subtotalBruto = itemsCompra.reduce((t, i) => t + (i.cantidad * i.costoUnitario), 0);
    const igvCalculado = subtotalBruto * TASA_IGV;
    const totalCompra = subtotalBruto + igvCalculado;

    const seleccionarItem = (itemId) => {
        setItemIdSel(itemId);
        const item = itemsInventario.find((i) => String(i.item_id) === itemId);
        setItemCosto(item ? String(Number(item.costo_compra)) : "");
    };

    const agregarItemTabla = () => {
        const item = itemsInventario.find((i) => String(i.item_id) === itemIdSel);
        const cantidad = Number(itemCant);
        const costo = Number(itemCosto);
        if (!item || cantidad <= 0 || itemCosto === "" || costo < 0) return;

        setItemsCompra((actuales) => {
            const existente = actuales.find((i) => i.item_id === item.item_id);
            if (existente) {
                return actuales.map((i) => i.item_id === item.item_id
                    ? { ...i, cantidad: i.cantidad + cantidad, costoUnitario: costo }
                    : i);
            }
            return [...actuales, {
                item_id: item.item_id,
                codigo: item.codigo_referencia,
                descripcion: item.nombre_nomenclatura,
                cantidad,
                costoUnitario: costo
            }];
        });
        setItemIdSel("");
        setItemCant("");
        setItemCosto("");
    };

    const quitarItemTabla = (itemId) => {
        setItemsCompra((actuales) => actuales.filter((i) => i.item_id !== itemId));
    };

    const emitirOrdenCompra = async (e) => {
        e.preventDefault();
        if (!proveedorSel) {
            alert("Selecciona un proveedor.");
            return;
        }
        if (itemsCompra.length === 0) {
            alert("Agrega al menos un ítem a la orden de compra.");
            return;
        }
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
        try {
            setGuardandoCompra(true);
            await crearCompra({
                proveedor_id: Number(proveedorSel),
                usuario_id: usuarioActual.user_id,
<<<<<<< HEAD
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
=======
                subtotal: subtotalBruto,
                impuestos: igvCalculado,
                descuentos: 0,
                total: totalCompra,
                estado: "Registrada",
                detalles: itemsCompra.map((i) => {
                    const importe = i.cantidad * i.costoUnitario;
                    const impuesto = importe * TASA_IGV;
                    return {
                        item_id: i.item_id,
                        cantidad: i.cantidad,
                        precio_unitario: i.costoUnitario,
                        descuento: 0,
                        impuesto,
                        total: importe + impuesto
                    };
                })
            };
            await crearCompra(nuevaCompra);
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
            setMostrarModal(false);
            setItemsCompra([]);
            await cargarDatos();
            alert("Orden de compra registrada con los artículos seleccionados.");
        } catch (error) {
            console.error("Error registrando compra:", error);
<<<<<<< HEAD
            alert(error.message || "No se pudo registrar la orden de compra.");
        } finally {
            setGuardandoCompra(false);
=======
            alert(error.message || "Error al registrar la compra");
        }
    };

    // Recepción en almacén
    const [recepcionEnCurso, setRecepcionEnCurso] = useState(null);
    const [errorRecepcion, setErrorRecepcion] = useState("");
    const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);
    const [ordenEnProceso, setOrdenEnProceso] = useState(null);

    const proveedorDe = (orden) =>
        proveedores.find((p) => Number(p.proveedor_id) === Number(orden.proveedor_id));

    const recepcionesDe = (orden) =>
        recepciones.filter((r) => Number(r.compra_id) === Number(orden.compra_id) && r.estado === "Confirmada");

    const abrirRecepcion = async (orden) => {
        setOrdenEnProceso(orden.compra_id);
        try {
            const detalles = await obtenerDetallesCompra(orden.compra_id);
            if (detalles.length === 0) {
                alert("Esta orden se registró sin ítems, por lo que no se puede recibir en stock. Ajusta el stock desde Inventario.");
                return;
            }

            const recibido = {};
            recepcionesDe(orden).forEach((r) => (r.detalles || []).forEach((d) => {
                recibido[d.item_id] = (recibido[d.item_id] || 0) + Number(d.cantidad_recibida);
            }));

            setErrorRecepcion("");
            setRecepcionEnCurso({
                orden,
                lineas: detalles.map((d) => {
                    const ordenada = Number(d.cantidad);
                    const previa = recibido[d.item_id] || 0;
                    const pendiente = Math.max(ordenada - previa, 0);
                    return {
                        item_id: d.item_id,
                        codigo: d.codigo_referencia,
                        descripcion: d.descripcion || `Ítem ${d.item_id}`,
                        precio: Number(d.precio_unitario),
                        ordenada,
                        pendiente,
                        recibir: String(pendiente)
                    };
                })
            });
        } catch (error) {
            console.error("Error preparando recepción:", error);
            alert(error.message || "No se pudo cargar el detalle de la orden.");
        } finally {
            setOrdenEnProceso(null);
        }
    };

    const cambiarCantidadRecibida = (itemId, valor) => {
        setRecepcionEnCurso((actual) => ({
            ...actual,
            lineas: actual.lineas.map((l) => l.item_id === itemId ? { ...l, recibir: valor } : l)
        }));
    };

    const confirmarRecepcion = async (e) => {
        e.preventDefault();
        const { orden, lineas } = recepcionEnCurso;
        const aRecibir = lineas.filter((l) => Number(l.recibir) > 0);

        if (aRecibir.length === 0) {
            setErrorRecepcion("Indica la cantidad recibida de al menos un ítem.");
            return;
        }
        if (aRecibir.some((l) => Number(l.recibir) > l.pendiente)) {
            setErrorRecepcion("Una cantidad recibida supera lo pendiente de la orden.");
            return;
        }

        setGuardandoRecepcion(true);
        setErrorRecepcion("");
        try {
            if (!usuarioActual?.user_id) throw new Error("Inicia sesión para registrar la recepción.");
            await registrarRecepcion({
                compra_id: orden.compra_id,
                proveedor_id: orden.proveedor_id,
                usuario_id: usuarioActual.user_id,
                estado: "Confirmada",
                confirmar: true,
                detalles: aRecibir.map((l) => ({
                    item_id: l.item_id,
                    descripcion: l.descripcion,
                    cantidad_ordenada: l.ordenada,
                    cantidad_recibida: Number(l.recibir),
                    cantidad_pendiente: l.pendiente - Number(l.recibir),
                    precio_unitario: l.precio,
                    total: Number(l.recibir) * l.precio
                }))
            });
            setRecepcionEnCurso(null);
            cargarDatos();
            alert("Recepción registrada y stock actualizado.");
        } catch (error) {
            console.error("Error registrando recepción:", error);
            setErrorRecepcion(error.message || "No se pudo registrar la recepción.");
        } finally {
            setGuardandoRecepcion(false);
        }
    };

    // PDF de la orden
    const verOrdenPdf = async (orden) => {
        setOrdenEnProceso(orden.compra_id);
        try {
            const detalles = await obtenerDetallesCompra(orden.compra_id);
            const abierta = imprimirOrdenCompra({ orden, proveedor: proveedorDe(orden), detalles });
            if (!abierta) alert("El navegador bloqueó la ventana. Permite ventanas emergentes para generar el PDF.");
        } catch (error) {
            console.error("Error generando ODC:", error);
            alert(error.message || "No se pudo generar la orden de compra.");
        } finally {
            setOrdenEnProceso(null);
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
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

    const estadosDisponibles = [...new Set([...ESTADOS_COMPRA, ...ordenesCompra.map((o) => o.estado)])];

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
                    Nueva Orden de Compra
                </button>
            </div>

<<<<<<< HEAD
            <div className="reportes-tabs-nav" style={{ marginBottom: "16px" }}>
                {SUBMENUS_COMPRAS.map((tab) => (
=======
            {/* PESTAÑAS HORIZONTALES */}
            <div className="reportes-tabs-nav">
                {SUBMENUS_COMPRAS.map(tab => (
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
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

<<<<<<< HEAD
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
=======
            {/* BARRA DE FILTROS DE ESTADO */}
            {submodulo === "Órdenes de Compra" && (
                <div className="os-filter-bar">
                    <div className="reportes-filter-item">
                        <label>Filtrar por Estado:</label>
                        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                            <option value="Todos">Todos los Estados</option>
                            {estadosDisponibles.map((estado) => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
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
<<<<<<< HEAD
                                <th>Artículos</th>
                                <th>Subtotal</th>
                                <th>Impuestos</th>
                                <th>Total ODC (S/)</th>
=======
                                <th className="vm-num">Subtotal</th>
                                <th className="vm-num">IGV (18%)</th>
                                <th className="vm-num">Total ODC (S/)</th>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
<<<<<<< HEAD
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
=======
                            {ordenesFiltradas.map(o => (
                                <tr key={o.compra_id}>
                                    <td><span className="vm-code">{o.codigo_compra}</span></td>
                                    <td>{proveedorDe(o)?.razon_social || "Proveedor no encontrado"}</td>
                                    <td>{new Date(o.fecha_compra).toLocaleDateString()}</td>
                                    <td className="vm-num">S/ {parseFloat(o.subtotal).toFixed(2)}</td>
                                    <td className="vm-num">S/ {parseFloat(o.impuestos).toFixed(2)}</td>
                                    <td className="vm-num"><strong>S/ {parseFloat(o.total).toFixed(2)}</strong></td>
                                    <td>
                                        <span className={`vm-badge ${o.estado === "Recibida" ? "vm-badge-success" : o.estado === "Registrada" ? "vm-badge-info" : "vm-badge-danger"}`}>
                                            {o.estado === "Registrada" && recepcionesDe(o).length > 0 ? "Recepción parcial" : o.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-act-table link"
                                                disabled={ordenEnProceso === o.compra_id}
                                                onClick={() => verOrdenPdf(o)}
                                            >
                                                <span className="material-symbols-outlined">picture_as_pdf</span>
                                                ODC PDF
                                            </button>
                                            {o.estado !== "Recibida" && (
                                                <button
                                                    className="btn-act-table nps"
                                                    disabled={ordenEnProceso === o.compra_id}
                                                    onClick={() => abrirRecepcion(o)}
                                                >
                                                    <span className="material-symbols-outlined">inventory_2</span>
                                                    Recibir en Stock
                                                </button>
                                            )}
                                        </div>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="vm-empty compras-tabla-vacia">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <strong>Sin órdenes de compra</strong>
                        <span>No hay órdenes para el estado seleccionado.</span>
                    </div>
                </div>
            )}

<<<<<<< HEAD
=======
            {/* RECEPCIONES DE ALMACÉN */}
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
            {submodulo === "Recepciones de Almacén" && (
                <div className="os-table-wrapper">
                    <table className="os-table">
                        <thead>
                            <tr>
<<<<<<< HEAD
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
=======
                                <th>N° Recepción</th>
                                <th>N° ODC</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Ítems</th>
                                <th className="vm-num">Unidades</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recepciones.map((r) => {
                                const orden = ordenesCompra.find((o) => Number(o.compra_id) === Number(r.compra_id));
                                const proveedor = proveedores.find((p) => Number(p.proveedor_id) === Number(r.proveedor_id));
                                const unidades = (r.detalles || []).reduce((t, d) => t + Number(d.cantidad_recibida), 0);
                                return (
                                    <tr key={r.recepcion_id}>
                                        <td><span className="vm-code">REC-{r.recepcion_id}</span></td>
                                        <td><span className="vm-code">{orden?.codigo_compra || `#${r.compra_id}`}</span></td>
                                        <td>{proveedor?.razon_social || "Proveedor no encontrado"}</td>
                                        <td>{new Date(r.fecha_recepcion).toLocaleDateString()}</td>
                                        <td>{(r.detalles || []).map((d) => d.descripcion).join(", ")}</td>
                                        <td className="vm-num">{unidades}</td>
                                        <td><span className="vm-badge vm-badge-success">{r.estado}</span></td>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
<<<<<<< HEAD
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
=======
                    <div className="vm-empty compras-tabla-vacia">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <strong>Sin recepciones</strong>
                        <span>Las recepciones aparecen aquí al usar «Recibir en Stock» en una orden.</span>
                    </div>
                </div>
            )}

            {submodulo === "Facturas de Proveedor" && (
                <FacturasProveedor
                    proveedores={proveedores}
                    ordenesCompra={ordenesCompra}
                    usuarioActual={usuarioActual}
                />
            )}

            {/* MODAL NUEVA ORDEN DE COMPRA */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal">
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                        <div className="modal-header">
                            <div>
                                <h2>Nueva Orden de Compra (ODC)</h2>
                                <p>Selecciona artículos existentes del catálogo maestro de Inventario.</p>
                            </div>
<<<<<<< HEAD
                            <button className="btn-close" onClick={() => setMostrarModal(false)} type="button">✕</button>
=======
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setMostrarModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                        </div>
                        <form onSubmit={emitirOrdenCompra}>
                            <div className="modal-body">
<<<<<<< HEAD
                                <div style={{ marginBottom: "14px" }}>
                                    <label htmlFor="proveedor-odc" style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Proveedor Homologado *</label>
                                    <select id="proveedor-odc" value={proveedorSel} onChange={(event) => setProveedorSel(event.target.value)} required>
=======
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">storefront</span>
                                    Proveedor
                                </div>
                                <div className="form-group">
                                    <label>Proveedor Homologado *</label>
                                    <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                                        <option value="">Selecciona proveedor</option>
                                        {proveedores.map((proveedor) => (
                                            <option key={proveedor.proveedor_id} value={proveedor.proveedor_id}>{proveedor.razon_social}</option>
                                        ))}
                                    </select>
                                </div>

<<<<<<< HEAD
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
=======
                                <div className="vm-form-section-title">
                                    <span className="material-symbols-outlined">list_alt</span>
                                    Ítems Requeridos
                                </div>
                                <div className="vm-table-wrap compras-items">
                                    <table className="os-table">
                                        <thead>
                                            <tr>
                                                <th>Descripción</th>
                                                <th className="vm-num">Cant.</th>
                                                <th className="vm-num">Costo Unit (S/)</th>
                                                <th className="vm-num">Total (S/)</th>
                                                <th aria-label="Acciones"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsCompra.map((it) => (
                                                <tr key={it.item_id}>
                                                    <td>
                                                        <span className="vm-code">{it.codigo}</span> {it.descripcion}
                                                    </td>
                                                    <td className="vm-num">{it.cantidad}</td>
                                                    <td className="vm-num">S/ {it.costoUnitario.toFixed(2)}</td>
                                                    <td className="vm-num"><strong>S/ {(it.cantidad * it.costoUnitario).toFixed(2)}</strong></td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-act-table danger"
                                                            aria-label={`Quitar ${it.descripcion}`}
                                                            onClick={() => quitarItemTabla(it.item_id)}
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="vm-empty compras-items-vacio">
                                        <span>Aún no hay ítems. Agrégalos con el formulario de abajo.</span>
                                    </div>
                                </div>

                                {/* FORMULARIO AÑADIR ÍTEM */}
                                <div className="compras-item-form">
                                    <select aria-label="Ítem de inventario" value={itemIdSel} onChange={(e) => seleccionarItem(e.target.value)}>
                                        <option value="">Selecciona repuesto o insumo…</option>
                                        {itemsInventario.map((i) => (
                                            <option key={i.item_id} value={i.item_id}>
                                                {i.codigo_referencia} · {i.nombre_nomenclatura}
                                            </option>
                                        ))}
                                    </select>
                                    <input type="number" min="0.01" step="0.01" aria-label="Cantidad" placeholder="Cant" value={itemCant} onChange={(e) => setItemCant(e.target.value)} />
                                    <input type="number" min="0" step="0.01" aria-label="Costo unitario" placeholder="Costo S/" value={itemCosto} onChange={(e) => setItemCosto(e.target.value)} />
                                    <button type="button" className="vm-btn vm-btn-secondary" onClick={agregarItemTabla}>
                                        <span className="material-symbols-outlined">add</span>
                                        Añadir
                                    </button>
                                </div>

                                {/* RESUMEN FINANCIERO */}
                                <div className="compras-resumen">
                                    <div className="compras-resumen-fila">
                                        <span>Subtotal Bruto:</span>
                                        <span className="vm-num">S/ {subtotalBruto.toFixed(2)}</span>
                                    </div>
                                    <div className="compras-resumen-fila">
                                        <span>IGV (18%):</span>
                                        <span className="vm-num">S/ {igvCalculado.toFixed(2)}</span>
                                    </div>
                                    <div className="compras-resumen-fila compras-resumen-total">
                                        <span>TOTAL ORDEN DE COMPRA:</span>
                                        <span className="vm-num">S/ {totalCompra.toFixed(2)}</span>
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
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

<<<<<<< HEAD
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
=======
            {/* MODAL RECIBIR EN STOCK */}
            {recepcionEnCurso && (
                <div className="modal-overlay">
                    <div className="modal-content compras-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Recibir en Stock · {recepcionEnCurso.orden.codigo_compra}</h2>
                                <p>Confirma lo que llegó al almacén. Al registrar, se suma al stock de inventario.</p>
                            </div>
                            <button className="btn-close" aria-label="Cerrar" onClick={() => setRecepcionEnCurso(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={confirmarRecepcion}>
                            <div className="modal-body">
                                {errorRecepcion && (
                                    <div className="vm-alert" role="alert">
                                        <span className="material-symbols-outlined">error</span>
                                        <span>{errorRecepcion}</span>
                                    </div>
                                )}
                                <div className="vm-table-wrap compras-items">
                                    <table className="os-table">
                                        <thead>
                                            <tr>
                                                <th>Ítem</th>
                                                <th className="vm-num">Ordenado</th>
                                                <th className="vm-num">Pendiente</th>
                                                <th className="vm-num">Recibido ahora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recepcionEnCurso.lineas.map((l) => (
                                                <tr key={l.item_id}>
                                                    <td><span className="vm-code">{l.codigo}</span> {l.descripcion}</td>
                                                    <td className="vm-num">{l.ordenada}</td>
                                                    <td className="vm-num">{l.pendiente}</td>
                                                    <td className="vm-num">
                                                        <input
                                                            type="number"
                                                            className="compras-cantidad"
                                                            aria-label={`Cantidad recibida de ${l.descripcion}`}
                                                            min="0"
                                                            max={l.pendiente}
                                                            step="0.01"
                                                            value={l.recibir}
                                                            disabled={l.pendiente === 0}
                                                            onChange={(e) => cambiarCantidadRecibida(l.item_id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setRecepcionEnCurso(null)}>Cancelar</button>
                                <button type="submit" className="btn-guardar" disabled={guardandoRecepcion}>
                                    {guardandoRecepcion ? "Registrando…" : "Registrar Recepción"}
>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
<<<<<<< HEAD
=======

>>>>>>> c50f4ef899f2d8106c402b44bb7cd55c4df493ab
        </div>
    );
}

export default Compras;
