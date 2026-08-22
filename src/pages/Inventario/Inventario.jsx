import { useState } from "react";
import "./Inventario.css";

function Inventario() {
    const [categoria, setCategoria] = useState("Todos");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    const [productos, setProductos] = useState([
        {
            id: 1,
            nombre: "Pastillas de Freno Brembo",
            codigo: "BRK-892-C",
            categoria: "Frenos",
            stock: 45,
            minimo: 15,
            precio: 85.0
        },
        {
            id: 2,
            nombre: "Bujías NGK Iridium",
            codigo: "ENG-SP-441",
            categoria: "Motor",
            stock: 8,
            minimo: 20,
            precio: 12.5
        },
        {
            id: 3,
            nombre: "Foco Philips H7",
            codigo: "LGT-H7-12V",
            categoria: "Iluminación",
            stock: 112,
            minimo: 50,
            precio: 18.0
        },
        {
            id: 4,
            nombre: "Aceite Sintético 5W-30",
            codigo: "ENG-OIL-M1",
            categoria: "Motor",
            stock: 4,
            minimo: 24,
            precio: 9.99
        },
        {
            id: 5,
            nombre: "Disco de Freno Bosch",
            codigo: "BRK-ROT-88",
            categoria: "Frenos",
            stock: 32,
            minimo: 10,
            precio: 65.0
        }
    ]);

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: "",
        codigo: "",
        categoria: "Motor",
        stock: "",
        minimo: "",
        precio: ""
    });

    const totalProductos = productos.reduce(
        (total, producto) => total + producto.stock,
        0
    );

    const productosStockBajo = productos.filter(
        (producto) => producto.stock <= producto.minimo
    ).length;

    const valorInventario = productos.reduce(
        (total, producto) => total + producto.stock * producto.precio,
        0
    );

    const productosFiltrados = productos.filter((producto) => {
        const coincideCategoria =
            categoria === "Todos" || producto.categoria === categoria;

        const coincideBusqueda =
            producto.nombre
                .toLowerCase()
                .includes(busqueda.toLowerCase()) ||
            producto.codigo
                .toLowerCase()
                .includes(busqueda.toLowerCase());

        return coincideCategoria && coincideBusqueda;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setNuevoProducto({
            ...nuevoProducto,
            [name]: value
        });
    };

    const agregarProducto = (e) => {
        e.preventDefault();

        if (
            !nuevoProducto.nombre ||
            !nuevoProducto.codigo ||
            !nuevoProducto.stock ||
            !nuevoProducto.minimo ||
            !nuevoProducto.precio
        ) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const producto = {
            id: productos.length + 1,
            nombre: nuevoProducto.nombre,
            codigo: nuevoProducto.codigo,
            categoria: nuevoProducto.categoria,
            stock: Number(nuevoProducto.stock),
            minimo: Number(nuevoProducto.minimo),
            precio: Number(nuevoProducto.precio)
        };

        setProductos([...productos, producto]);

        setNuevoProducto({
            nombre: "",
            codigo: "",
            categoria: "Motor",
            stock: "",
            minimo: "",
            precio: ""
        });

        setMostrarFormulario(false);
    };

    return (
        <div className="inventario-page">

            {/* CABECERA */}
            <div className="inventario-header">
                <div>
                    <h2>Inventario</h2>
                    <p>
                        Gestiona y monitorea los productos y repuestos
                        disponibles en VeraMotors.
                    </p>
                </div>

                <div className="inventario-header-actions">
                    <button
                        className="btn-filtrar"
                        onClick={() => setCategoria("Todos")}
                    >
                        <span className="material-symbols-outlined">
                            filter_list
                        </span>
                        Filtrar
                    </button>

                    <button
                        className="btn-nuevo-producto"
                        onClick={() => setMostrarFormulario(true)}
                    >
                        <span className="material-symbols-outlined">
                            add
                        </span>
                        Nuevo producto
                    </button>
                </div>
            </div>

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <div className="formulario-overlay">
                    <div className="formulario-producto">

                        <div className="formulario-header">
                            <div>
                                <h3>Nuevo producto</h3>
                                <p>
                                    Registra un nuevo producto o repuesto
                                    para el inventario.
                                </p>
                            </div>

                            <button
                                className="btn-cerrar"
                                onClick={() => setMostrarFormulario(false)}
                            >
                                <span className="material-symbols-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <form onSubmit={agregarProducto}>

                            <div className="form-grid">

                                <div className="form-group form-group-full">
                                    <label>Nombre del producto *</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={nuevoProducto.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Pastillas de freno"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Código / SKU *</label>
                                    <input
                                        type="text"
                                        name="codigo"
                                        value={nuevoProducto.codigo}
                                        onChange={handleInputChange}
                                        placeholder="Ej. BRK-001"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Categoría *</label>
                                    <select
                                        name="categoria"
                                        value={nuevoProducto.categoria}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Motor">Motor</option>
                                        <option value="Frenos">Frenos</option>
                                        <option value="Iluminación">
                                            Iluminación
                                        </option>
                                        <option value="Suspensión">
                                            Suspensión
                                        </option>
                                        <option value="Lubricantes">
                                            Lubricantes
                                        </option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Stock actual *</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        min="0"
                                        value={nuevoProducto.stock}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Stock mínimo *</label>
                                    <input
                                        type="number"
                                        name="minimo"
                                        min="0"
                                        value={nuevoProducto.minimo}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Precio unitario (S/) *</label>
                                    <input
                                        type="number"
                                        name="precio"
                                        min="0"
                                        step="0.01"
                                        value={nuevoProducto.precio}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                    />
                                </div>

                            </div>

                            <div className="formulario-footer">
                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() =>
                                        setMostrarFormulario(false)
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-guardar"
                                >
                                    <span className="material-symbols-outlined">
                                        save
                                    </span>
                                    Guardar producto
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* ESTADÍSTICAS */}
            <div className="inventario-stats">

                <div className="stat-card">
                    <div className="stat-icon">
                        <span className="material-symbols-outlined">
                            inventory_2
                        </span>
                    </div>

                    <div className="stat-content">
                        <p>PRODUCTOS EN STOCK</p>

                        <div className="stat-value-row">
                            <h3>
                                {totalProductos.toLocaleString("es-PE")}
                            </h3>

                            <span className="stat-positive">
                                <span className="material-symbols-outlined">
                                    trending_up
                                </span>
                                +12%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <span className="material-symbols-outlined">
                            warning
                        </span>
                    </div>

                    <div className="stat-content">
                        <p>STOCK BAJO</p>

                        <div className="stat-value-row">
                            <h3 className="stat-error">
                                {productosStockBajo}
                            </h3>

                            <span className="stat-description">
                                Requieren atención
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <span className="material-symbols-outlined">
                            payments
                        </span>
                    </div>

                    <div className="stat-content">
                        <p>VALOR DEL INVENTARIO</p>

                        <div className="stat-value-row">
                            <h3>
                                S/{" "}
                                {valorInventario.toLocaleString("es-PE", {
                                    minimumFractionDigits: 2
                                })}
                            </h3>

                            <span className="stat-description">
                                Estimado
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* BUSCADOR */}
            <div className="inventario-search">
                <span className="material-symbols-outlined">
                    search
                </span>

                <input
                    type="text"
                    placeholder="Buscar producto o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* FILTROS */}
            <div className="inventario-filtros">

                <span className="filtros-title">
                    CATEGORÍAS:
                </span>

                {[
                    "Todos",
                    "Motor",
                    "Frenos",
                    "Iluminación",
                    "Suspensión",
                    "Lubricantes"
                ].map((item) => (
                    <button
                        key={item}
                        className={
                            categoria === item
                                ? "filtro activo"
                                : "filtro"
                        }
                        onClick={() => setCategoria(item)}
                    >
                        {item}
                    </button>
                ))}

            </div>

            {/* TABLA */}
            <div className="inventario-table-container">

                <table className="inventario-table">

                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Código</th>
                            <th>Categoría</th>
                            <th className="text-right">
                                Stock
                            </th>
                            <th className="text-right">
                                Stock mínimo
                            </th>
                            <th className="text-right">
                                Precio unitario
                            </th>
                            <th className="text-center">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        {productosFiltrados.map((producto) => {

                            const stockBajo =
                                producto.stock <= producto.minimo;

                            return (
                                <tr
                                    key={producto.id}
                                    className={
                                        stockBajo
                                            ? "producto-stock-bajo"
                                            : ""
                                    }
                                >

                                    <td className="producto-nombre">
                                        {producto.nombre}
                                    </td>

                                    <td className="producto-codigo">
                                        {producto.codigo}
                                    </td>

                                    <td>
                                        <span className="categoria-badge">
                                            {producto.categoria}
                                        </span>
                                    </td>

                                    <td
                                        className={
                                            stockBajo
                                                ? "stock stock-error"
                                                : "stock"
                                        }
                                    >
                                        {stockBajo && (
                                            <span className="material-symbols-outlined">
                                                warning
                                            </span>
                                        )}

                                        {producto.stock}
                                    </td>

                                    <td className="stock-minimo">
                                        {producto.minimo}
                                    </td>

                                    <td className="precio">
                                        S/{" "}
                                        {producto.precio.toFixed(2)}
                                    </td>

                                    <td className="acciones">

                                        <button
                                            title="Editar"
                                            onClick={() =>
                                                alert(
                                                    `Editar: ${producto.nombre}`
                                                )
                                            }
                                        >
                                            <span className="material-symbols-outlined">
                                                edit
                                            </span>
                                        </button>

                                        <button
                                            title="Más opciones"
                                            onClick={() =>
                                                alert(
                                                    `Opciones: ${producto.nombre}`
                                                )
                                            }
                                        >
                                            <span className="material-symbols-outlined">
                                                more_vert
                                            </span>
                                        </button>

                                    </td>

                                </tr>
                            );
                        })}

                        {productosFiltrados.length === 0 && (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="tabla-vacia"
                                >
                                    <span className="material-symbols-outlined">
                                        inventory_2
                                    </span>

                                    <p>
                                        No se encontraron productos.
                                    </p>
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

                {/* PAGINACIÓN */}
                <div className="inventario-pagination">

                    <p>
                        Mostrando 1 a{" "}
                        {productosFiltrados.length} de{" "}
                        {productos.length} productos
                    </p>

                    <div className="pagination-buttons">

                        <button disabled>
                            <span className="material-symbols-outlined">
                                chevron_left
                            </span>
                        </button>

                        <button className="pagina-activa">
                            1
                        </button>

                        <button>2</button>
                        <button>3</button>

                        <span>...</span>

                        <button>
                            <span className="material-symbols-outlined">
                                chevron_right
                            </span>
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Inventario;