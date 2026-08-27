import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    const navigate = useNavigate();

    // Usuario autenticado
    const usuarioGuardado = localStorage.getItem("usuario");

    const usuario = usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null;

    const rol = usuario?.rol || "";

    // Roles
    const esAdministrador = rol === "Administrador";
    const esAsesorServicio = rol === "Asesor de Servicio";
    const esAsesorRepuestos = rol === "Asesor de Repuestos";
    const esTecnico = rol === "Técnico Automotriz";

    // Cerrar sesión
    const cerrarSesion = () => {
        localStorage.removeItem("usuario");
        localStorage.removeItem("loginTime");

        navigate("/login", { replace: true });
    };

    return (
        <aside className="sidebar">

            {/* LOGO */}
            <div className="sidebar-brand">
                <div className="brand-icon">
                    VM
                </div>

                <div className="brand-info">
                    <h2>VERAMOTORS</h2>
                    <span>SAC</span>
                </div>
            </div>


            {/* MENÚ */}
            <nav className="sidebar-menu">

                {/* ==================================================
                    ADMINISTRADOR
                ================================================== */}

                {esAdministrador && (
                    <>
                        <div className="menu-section">
                            <span className="menu-title">PRINCIPAL</span>

                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▦</span>
                                <span>Dashboard</span>
                            </NavLink>

                            <NavLink
                                to="/citas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▣</span>
                                <span>Calendario de Citas</span>
                            </NavLink>

                            <NavLink
                                to="/kanban"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Tablero de Control</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">GESTIÓN</span>

                            <NavLink
                                to="/clientes"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">♙</span>
                                <span>Clientes</span>
                            </NavLink>

                            <NavLink
                                to="/inventario"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▣</span>
                                <span>Inventario</span>
                            </NavLink>

                            <NavLink
                                to="/ordenes-servicio"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">⚙</span>
                                <span>Órdenes de Servicio</span>
                            </NavLink>

                            <NavLink
                                to="/facturacion"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Facturación</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">ANÁLISIS</span>

                            <NavLink
                                to="/reportes"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▥</span>
                                <span>Reportes</span>
                            </NavLink>

                            <NavLink
                                to="/metricas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">◉</span>
                                <span>Métricas</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">RRHH</span>

                            <NavLink
                                to="/asistencia"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">◷</span>
                                <span>Asistencia</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">ADMINISTRACIÓN</span>

                            <NavLink
                                to="/proveedores"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">♙</span>
                                <span>Proveedores</span>
                            </NavLink>

                            <NavLink
                                to="/compras"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Compras</span>
                            </NavLink>

                            <NavLink
                                to="/bancos"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▥</span>
                                <span>Bancos</span>
                            </NavLink>

                            <NavLink
                                to="/configuracion"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">⚙</span>
                                <span>Configuración</span>
                            </NavLink>
                        </div>
                    </>
                )}


                {/* ==================================================
                    ASESOR DE SERVICIO
                ================================================== */}

                {esAsesorServicio && (
                    <>
                        <div className="menu-section">
                            <span className="menu-title">PRINCIPAL</span>

                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▦</span>
                                <span>Dashboard</span>
                            </NavLink>

                            <NavLink
                                to="/citas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▣</span>
                                <span>Calendario de Citas</span>
                            </NavLink>

                            <NavLink
                                to="/kanban"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Tablero de Control</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">GESTIÓN</span>

                            <NavLink
                                to="/clientes"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">♙</span>
                                <span>Clientes</span>
                            </NavLink>

                            <NavLink
                                to="/ordenes-servicio"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">⚙</span>
                                <span>Órdenes de Servicio</span>
                            </NavLink>

                            <NavLink
                                to="/facturacion"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Facturación</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">ANÁLISIS</span>

                            <NavLink
                                to="/metricas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">◉</span>
                                <span>Métricas</span>
                            </NavLink>
                        </div>
                    </>
                )}


                {/* ==================================================
                    ASESOR DE REPUESTOS
                ================================================== */}

                {esAsesorRepuestos && (
                    <>
                        <div className="menu-section">
                            <span className="menu-title">PRINCIPAL</span>

                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▦</span>
                                <span>Dashboard</span>
                            </NavLink>

                            <NavLink
                                to="/kanban"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Tablero de Control</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">GESTIÓN</span>

                            <NavLink
                                to="/inventario"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▣</span>
                                <span>Inventario</span>
                            </NavLink>

                            <NavLink
                                to="/ordenes-servicio"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">⚙</span>
                                <span>Órdenes de Servicio</span>
                            </NavLink>

                            <NavLink
                                to="/compras"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Compras</span>
                            </NavLink>

                            <NavLink
                                to="/proveedores"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">♙</span>
                                <span>Proveedores</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">ANÁLISIS</span>

                            <NavLink
                                to="/metricas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">◉</span>
                                <span>Métricas</span>
                            </NavLink>
                        </div>
                    </>
                )}


                {/* ==================================================
                    TÉCNICO AUTOMOTRIZ
                ================================================== */}

                {esTecnico && (
                    <>
                        <div className="menu-section">
                            <span className="menu-title">
                                PRINCIPAL
                            </span>

                            <NavLink
                                to="/kanban"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">▤</span>
                                <span>Mis Tickets Asignados</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">
                                TALLER & DIAGNÓSTICO
                            </span>

                            <NavLink
                                to="/ordenes-servicio"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">⚙</span>
                                <span>Diagnóstico y Reparación</span>
                            </NavLink>
                        </div>

                        <div className="menu-section">
                            <span className="menu-title">
                                ANÁLISIS
                            </span>

                            <NavLink
                                to="/metricas"
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="menu-icon">◉</span>
                                <span>Mis Métricas</span>
                            </NavLink>
                        </div>
                    </>
                )}

            </nav>


            {/* ==================================================
                USUARIO + CERRAR SESIÓN
            ================================================== */}

            <div className="sidebar-user-container">

                <div className="sidebar-user">

                    <div className="user-avatar">
                        {usuario?.nombre
                            ? usuario.nombre
                                .substring(0, 2)
                                .toUpperCase()
                            : "VM"
                        }
                    </div>

                    <div className="user-info">
                        <strong>
                            {usuario?.nombre || "Usuario"}
                        </strong>

                        <span>
                            {usuario?.rol || "Sin rol"}
                        </span>
                    </div>

                </div>


                {/* BOTÓN CERRAR SESIÓN */}
                <button
                    type="button"
                    className="logout-button"
                    onClick={cerrarSesion}
                >
                    <span>↪</span>
                    <span>Cerrar sesión</span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;