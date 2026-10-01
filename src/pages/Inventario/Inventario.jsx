import { useEffect, useMemo, useState } from "react";
import "./Inventario.css";

import {
    obtenerInventario,
    obtenerCategoriasInventario,
    crearItem,
    actualizarItem,
    desactivarItem
} from "../../services/inventarioService";


const estadoInicial = {
    tipo: "Repuesto",
    nombre: "",
    codigo: "",
    categoria_id: "",
    unidad: "Unidad",
    marca: "",
    costo: "",
    margenGanancia: "",
    precio: "",
    stock: "",
    minimo: "",
    igv: "18"
};


function Inventario() {

    const [submodulo, setSubmodulo] =
        useState("Ítem de venta");

    const [categoria, setCategoria] =
        useState("Todos");

    const [categorias, setCategorias] =
        useState([]);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [mostrarAyudaNomenclatura, setMostrarAyudaNomenclatura] =
        useState(false);

    const [busqueda, setBusqueda] =
        useState("");

    const [cargando, setCargando] =
        useState(false);

    const [guardando, setGuardando] =
        useState(false);

    const [productos, setProductos] =
        useState([]);

    const [modoEdicion, setModoEdicion] =
        useState(false);

    const [itemEditando, setItemEditando] =
        useState(null);

    const [nuevoProducto, setNuevoProducto] =
        useState(estadoInicial);


    const cargarDatos = async () => {

        try {

            setCargando(true);

            const [
                inventario,
                categoriasData
            ] = await Promise.all([
                obtenerInventario(),
                obtenerCategoriasInventario()
            ]);

            setCategorias(
                Array.isArray(categoriasData)
                    ? categoriasData
                    : []
            );

            const transformados =
                inventario.map((item) => ({
                    id: item.item_id,
                    tipo: item.tipo,
                    nombre: item.nombre_nomenclatura || "",
                    codigo: item.codigo_referencia || "",
                    unidad: item.unidad_medida || "",
                    marca: item.marca || "",
                    categoria: item.categoria_nombre || "",
                    categoriaId: item.categoria_id,
                    stock: Number(item.stock_actual || 0),
                    minimo: Number(item.stock_minimo || 0),
                    costo: Number(item.costo_compra || 0),
                    precio: Number(item.precio_venta || 0),
                    margenGanancia: Number(item.margen_ganancia || 0),
                    igv: Number(item.impuesto || 0)
                }));

            setProductos(transformados);

        } catch (error) {

            console.error(
                "Error cargando inventario:",
                error
            );

            alert(
                error.message ||
                "No se pudo cargar el inventario."
            );

        } finally {

            setCargando(false);
        }
    };


    useEffect(() => {

        cargarDatos();

    }, []);


    const totalProductos =
        productos.reduce(
            (total, producto) =>
                total + Number(producto.stock || 0),
            0
        );


    const productosStockBajo =
        productos.filter(
            (producto) =>
                Number(producto.stock) <=
                Number(producto.minimo)
        ).length;


    const valorInventario =
        productos.reduce(
            (total, producto) =>
                total +
                Number(producto.stock || 0) *
                Number(producto.precio || 0),
            0
        );


    const productosFiltrados =
        useMemo(() => {

            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return productos.filter((producto) => {

                const coincideCategoria =
                    categoria === "Todos" ||
                    producto.categoria === categoria;

                const coincideBusqueda =
                    !texto ||
                    producto.nombre
                        .toLowerCase()
                        .includes(texto) ||
                    producto.codigo
                        .toLowerCase()
                        .includes(texto) ||
                    producto.marca
                        .toLowerCase()
                        .includes(texto);

                return (
                    coincideCategoria &&
                    coincideBusqueda
                );
            });

        }, [
            productos,
            categoria,
            busqueda
        ]);


    const handleInputChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setNuevoProducto(
            (actual) => ({
                ...actual,
                [name]: value
            })
        );
    };


    const limpiarFormulario = () => {

        setNuevoProducto({
            ...estadoInicial
        });

        setModoEdicion(false);
        setItemEditando(null);
    };


    const abrirNuevo = () => {

        limpiarFormulario();

        setMostrarFormulario(true);
    };


    const editarProducto = (producto) => {

        setModoEdicion(true);
        setItemEditando(producto.id);

        setNuevoProducto({
            tipo: producto.tipo,
            nombre: producto.nombre,
            codigo: producto.codigo,
            categoria_id: String(producto.categoriaId || ""),
            unidad: producto.unidad,
            marca: producto.marca,
            costo: String(producto.costo),
            margenGanancia:
                String(producto.margenGanancia),
            precio: String(producto.precio),
            stock: String(producto.stock),
            minimo: String(producto.minimo),
            igv: String(producto.igv)
        });

        setMostrarFormulario(true);
    };


    const guardarProducto = async (event) => {

        event.preventDefault();

        if (!nuevoProducto.nombre.trim()) {
            alert("Ingresa el nombre del ítem.");
            return;
        }

        if (!nuevoProducto.codigo.trim()) {
            alert("Ingresa el código de referencia.");
            return;
        }

        if (!nuevoProducto.categoria_id) {
            alert("Selecciona una categoría real.");
            return;
        }

        if (
            nuevoProducto.precio === "" ||
            Number(nuevoProducto.precio) < 0
        ) {
            alert("Ingresa un precio de venta válido.");
            return;
        }


        const body = {

            tipo: nuevoProducto.tipo,

            categoria_id:
                Number(nuevoProducto.categoria_id),

            codigo_referencia:
                nuevoProducto.codigo.trim(),

            nombre_nomenclatura:
                nuevoProducto.nombre.trim(),

            unidad_medida:
                nuevoProducto.unidad,

            marca:
                nuevoProducto.marca.trim() ||
                null,

            stock_actual:
                Number(nuevoProducto.stock) || 0,

            stock_minimo:
                Number(nuevoProducto.minimo) || 0,

            costo_compra:
                Number(nuevoProducto.costo) || 0,

            margen_ganancia:
                Number(nuevoProducto.margenGanancia) || 0,

            precio_venta:
                Number(nuevoProducto.precio) || 0,

            impuesto:
                Number(nuevoProducto.igv) || 0
        };


        try {

            setGuardando(true);

            if (modoEdicion) {

                await actualizarItem(
                    itemEditando,
                    body
                );

                alert(
                    "Ítem actualizado correctamente."
                );

            } else {

                await crearItem(body);

                alert(
                    "Ítem registrado correctamente."
                );
            }

            setMostrarFormulario(false);

            limpiarFormulario();

            await cargarDatos();

        } catch (error) {

            console.error(
                "Error guardando inventario:",
                error
            );

            alert(
                error.message ||
                "No se pudo guardar el ítem."
            );

        } finally {

            setGuardando(false);
        }
    };


    const eliminarProducto = async (producto) => {

        const confirmar =
            window.confirm(
                `¿Deseas desactivar el ítem "${producto.nombre}"?`
            );

        if (!confirmar) {
            return;
        }

        try {

            await desactivarItem(
                producto.id
            );

            alert(
                "Ítem desactivado correctamente."
            );

            await cargarDatos();

        } catch (error) {

            console.error(
                "Error desactivando ítem:",
                error
            );

            alert(
                error.message ||
                "No se pudo desactivar el ítem."
            );
        }
    };


    const exportarCSV = () => {

        if (!productosFiltrados.length) {
            alert(
                "No hay datos para exportar."
            );
            return;
        }


        const encabezados = [
            "Tipo",
            "Código",
            "Nombre",
            "Unidad",
            "Categoría",
            "Marca",
            "Stock",
            "Stock mínimo",
            "Costo",
            "Precio",
            "IGV"
        ];


        const escapar = (valor) => {

            const texto =
                String(valor ?? "");

            return `"${texto.replace(
                /"/g,
                '""'
            )}"`;
        };


        const filas =
            productosFiltrados.map(
                (producto) =>
                    [
                        producto.tipo,
                        producto.codigo,
                        producto.nombre,
                        producto.unidad,
                        producto.categoria,
                        producto.marca,
                        producto.stock,
                        producto.minimo,
                        producto.costo.toFixed(2),
                        producto.precio.toFixed(2),
                        producto.igv
                    ]
                        .map(escapar)
                        .join(",")
            );


        const csv =
            "\uFEFF" +
            [
                encabezados.map(escapar).join(","),
                ...filas
            ].join("\n");


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(blob);

        const enlace =
            document.createElement("a");

        enlace.href = url;

        enlace.download =
            `inventario-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        document.body.appendChild(
            enlace
        );

        enlace.click();

        enlace.remove();

        URL.revokeObjectURL(url);
    };


    return (
        <div className="inventario-page">

            <div className="inventario-header">

                <div>
                    <h2>
                        Inventario de Repuestos e Insumos
                    </h2>

                    <p>
                        Catálogo real conectado a PostgreSQL.
                    </p>
                </div>


                <div className="inventario-header-actions">

                    <button
                        className="btn-filtrar"
                        onClick={exportarCSV}
                        type="button"
                    >
                        <span className="material-symbols-outlined">
                            file_download
                        </span>

                        Exportar CSV
                    </button>


                    <button
                        className="btn-nuevo-producto"
                        onClick={abrirNuevo}
                        type="button"
                    >
                        <span className="material-symbols-outlined">
                            add
                        </span>

                        Nuevo Ítem
                    </button>

                </div>

            </div>


            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    borderBottom:
                        "1px solid #cbd5e1",
                    paddingBottom: "8px",
                    marginBottom: "16px"
                }}
            >

                {[
                    "Ítem de venta",
                    "Planta y equipo",
                    "Categorías"
                ].map((tab) => (

                    <button
                        key={tab}
                        type="button"
                        style={{
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "6px",
                            background:
                                submodulo === tab
                                    ? "#2563eb"
                                    : "#f1f5f9",
                            color:
                                submodulo === tab
                                    ? "#ffffff"
                                    : "#475569",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            cursor: "pointer"
                        }}
                        onClick={() =>
                            setSubmodulo(tab)
                        }
                    >
                        {tab}
                    </button>

                ))}

            </div>


            <div
                className="stats-inventario"
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px"
                }}
            >

                <div
                    className="stat-inv-card"
                    style={{
                        background: "#ffffff",
                        padding: "16px",
                        borderRadius: "8px",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >
                    <span>
                        Total Ítems en Stock
                    </span>

                    <h3>
                        {totalProductos}
                    </h3>
                </div>


                <div
                    className="stat-inv-card"
                    style={{
                        background: "#ffffff",
                        padding: "16px",
                        borderRadius: "8px",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >
                    <span>
                        Alertas de Stock Bajo
                    </span>

                    <h3>
                        {productosStockBajo} ítems
                    </h3>
                </div>


                <div
                    className="stat-inv-card"
                    style={{
                        background: "#ffffff",
                        padding: "16px",
                        borderRadius: "8px",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >
                    <span>
                        Valor Total del Inventario
                    </span>

                    <h3>
                        S/ {valorInventario.toFixed(2)}
                    </h3>
                </div>

            </div>


            <div
                className="os-filter-bar"
                style={{
                    marginBottom: "16px"
                }}
            >

                <div className="filter-search">

                    <span className="material-symbols-outlined">
                        search
                    </span>

                    <input
                        type="text"
                        placeholder="Buscar por código, nombre o marca..."
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={categoria}
                    onChange={(event) =>
                        setCategoria(
                            event.target.value
                        )
                    }
                    style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border:
                            "1px solid #cbd5e1"
                    }}
                >

                    <option value="Todos">
                        Todas las Categorías
                    </option>

                    {categorias.map(
                        (item) => (
                            <option
                                key={
                                    item.categoria_id
                                }
                                value={
                                    item.nombre
                                }
                            >
                                {item.nombre}
                            </option>
                        )
                    )}

                </select>

            </div>


            <div className="os-table-wrapper">

                <table className="os-table">

                    <thead>

                        <tr>
                            <th>Tipo</th>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Unidad</th>
                            <th>Categoría</th>
                            <th>Marca</th>
                            <th>Stock</th>
                            <th>Costo</th>
                            <th>Precio</th>
                            <th>Acciones</th>
                        </tr>

                    </thead>


                    <tbody>

                        {cargando ? (

                            <tr>
                                <td
                                    colSpan="10"
                                    style={{
                                        textAlign: "center",
                                        padding: "30px"
                                    }}
                                >
                                    Cargando inventario...
                                </td>
                            </tr>

                        ) : productosFiltrados.length ? (

                            productosFiltrados.map(
                                (producto) => (

                                    <tr
                                        key={
                                            producto.id
                                        }
                                    >

                                        <td>
                                            <span
                                                className={`proc-tag ${String(
                                                    producto.tipo
                                                ).toLowerCase()}`}
                                            >
                                                {
                                                    producto.tipo
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    producto.codigo
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {
                                                producto.nombre
                                            }
                                        </td>

                                        <td>
                                            {
                                                producto.unidad
                                            }
                                        </td>

                                        <td>
                                            {
                                                producto.categoria
                                            }
                                        </td>

                                        <td>
                                            {
                                                producto.marca
                                            }
                                        </td>

                                        <td>

                                            <span
                                                style={{
                                                    color:
                                                        producto.stock <=
                                                        producto.minimo
                                                            ? "#ef4444"
                                                            : "#1e293b",
                                                    fontWeight:
                                                        "bold"
                                                }}
                                            >
                                                {
                                                    producto.stock
                                                }
                                            </span>

                                        </td>

                                        <td>
                                            S/{" "}
                                            {producto.costo.toFixed(
                                                2
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                S/{" "}
                                                {producto.precio.toFixed(
                                                    2
                                                )}
                                            </strong>
                                        </td>

                                        <td>

                                            <div className="table-actions">

                                                <button
                                                    type="button"
                                                    className="btn-act-table link"
                                                    onClick={() =>
                                                        editarProducto(
                                                            producto
                                                        )
                                                    }
                                                >
                                                    ✏️ Editar
                                                </button>


                                                <button
                                                    type="button"
                                                    className="btn-act-table btn-reject"
                                                    style={{
                                                        background:
                                                            "#fee2e2",
                                                        color:
                                                            "#b91c1c"
                                                    }}
                                                    onClick={() =>
                                                        eliminarProducto(
                                                            producto
                                                        )
                                                    }
                                                >
                                                    🗑️
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        ) : (

                            <tr>
                                <td
                                    colSpan="10"
                                    style={{
                                        textAlign: "center",
                                        padding: "30px"
                                    }}
                                >
                                    No hay ítems para mostrar.
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

            </div>


            {mostrarFormulario && (

                <div className="modal-overlay">

                    <div
                        className="modal-content inv-modal"
                        style={{
                            maxWidth: "650px"
                        }}
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {modoEdicion
                                        ? "Editar Ítem de Inventario"
                                        : "Nuevo Ítem de Inventario"}
                                </h2>

                                <p>
                                    Los datos se guardan directamente en PostgreSQL.
                                </p>

                            </div>


                            <button
                                className="btn-close"
                                type="button"
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    limpiarFormulario();
                                }}
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={guardarProducto}
                        >

                            <div className="modal-body">

                                <div
                                    className="form-grid"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap: "14px",
                                        marginBottom: "14px"
                                    }}
                                >

                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Tipo *
                                        </label>

                                        <select
                                            className="inv-select"
                                            name="tipo"
                                            value={
                                                nuevoProducto.tipo
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        >

                                            <option value="Repuesto">
                                                Repuesto
                                            </option>

                                            <option value="Insumo">
                                                Insumo
                                            </option>

                                            <option value="Servicio">
                                                Servicio
                                            </option>

                                        </select>

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Unidad de Medida *
                                        </label>

                                        <input
                                            className="inv-input"
                                            name="unidad"
                                            value={
                                                nuevoProducto.unidad
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div
                                    className="form-grid"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr",
                                        gap: "14px",
                                        marginBottom: "14px"
                                    }}
                                >

                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Código Referencia *
                                        </label>

                                        <input
                                            className="inv-input"
                                            name="codigo"
                                            value={
                                                nuevoProducto.codigo
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Categoría *
                                        </label>

                                        <select
                                            className="inv-select"
                                            name="categoria_id"
                                            value={
                                                nuevoProducto.categoria_id
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Selecciona categoría
                                            </option>

                                            {categorias.map(
                                                (item) => (

                                                    <option
                                                        key={
                                                            item.categoria_id
                                                        }
                                                        value={
                                                            item.categoria_id
                                                        }
                                                    >
                                                        {
                                                            item.nombre
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>


                                <div
                                    className="inv-field"
                                    style={{
                                        marginBottom: "14px"
                                    }}
                                >

                                    <label className="inv-label">
                                        Nombre *
                                    </label>

                                    <input
                                        className="inv-input"
                                        name="nombre"
                                        value={
                                            nuevoProducto.nombre
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />

                                </div>


                                <div
                                    className="form-grid"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr 1fr",
                                        gap: "14px",
                                        marginBottom: "14px"
                                    }}
                                >

                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Marca
                                        </label>

                                        <input
                                            className="inv-input"
                                            name="marca"
                                            value={
                                                nuevoProducto.marca
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Stock
                                        </label>

                                        <input
                                            className="inv-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="stock"
                                            value={
                                                nuevoProducto.stock
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Stock mínimo
                                        </label>

                                        <input
                                            className="inv-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="minimo"
                                            value={
                                                nuevoProducto.minimo
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                    </div>

                                </div>


                                <div
                                    className="form-grid"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1fr 1fr 1fr",
                                        gap: "14px"
                                    }}
                                >

                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Costo
                                        </label>

                                        <input
                                            className="inv-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="costo"
                                            value={
                                                nuevoProducto.costo
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Margen %
                                        </label>

                                        <input
                                            className="inv-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="margenGanancia"
                                            value={
                                                nuevoProducto.margenGanancia
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                    </div>


                                    <div className="inv-field">

                                        <label className="inv-label">
                                            Precio venta *
                                        </label>

                                        <input
                                            className="inv-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="precio"
                                            value={
                                                nuevoProducto.precio
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div
                                    className="inv-field"
                                    style={{
                                        marginTop: "14px"
                                    }}
                                >

                                    <label className="inv-label">
                                        IGV %
                                    </label>

                                    <input
                                        className="inv-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="igv"
                                        value={
                                            nuevoProducto.igv
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    />

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() => {
                                        setMostrarFormulario(false);
                                        limpiarFormulario();
                                    }}
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="btn-guardar"
                                    disabled={guardando}
                                >
                                    {guardando
                                        ? "Guardando..."
                                        : modoEdicion
                                            ? "Guardar cambios"
                                            : "Registrar Ítem"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {mostrarAyudaNomenclatura && (

                <div className="modal-overlay">

                    <div
                        className="modal-content inv-modal"
                        style={{
                            maxWidth: "550px"
                        }}
                    >

                        <div className="modal-header">

                            <h2>
                                Reglas de Nomenclatura
                            </h2>

                            <button
                                className="btn-close"
                                type="button"
                                onClick={() =>
                                    setMostrarAyudaNomenclatura(
                                        false
                                    )
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <div
                            className="modal-body"
                            style={{
                                lineHeight: "1.6"
                            }}
                        >

                            <p>
                                Utiliza una descripción clara y consistente del ítem.
                            </p>

                            <ul>
                                <li>
                                    Repuestos: componente + posición + marca.
                                </li>

                                <li>
                                    Servicios: "Servicio de..." + sistema.
                                </li>

                                <li>
                                    Insumos: nombre + presentación.
                                </li>
                            </ul>

                        </div>


                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn-guardar"
                                onClick={() =>
                                    setMostrarAyudaNomenclatura(
                                        false
                                    )
                                }
                            >
                                Entendido
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Inventario;