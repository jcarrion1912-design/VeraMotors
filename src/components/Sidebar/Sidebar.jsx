import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
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

                {/* PRINCIPAL */}
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

                {/* GESTIÓN */}
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

                {/* ANÁLISIS */}
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

                {/* ADMINISTRACIÓN */}
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

            </nav>

            {/* USUARIO */}
            <div className="sidebar-user">

                <div className="user-avatar">
                    AD
                </div>

                <div className="user-info">
                    <strong>Administrador</strong>
                    <span>Administrador</span>
                </div>

                <button
                    className="logout-button"
                    title="Cerrar sesión"
                >
                    ↪
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;