import { NavLink } from "react-router-dom";
import { useRole } from "../../context/RoleContext";
import "./Sidebar.css";

function Sidebar() {
    const { rolActivo, setRolActivo, ROLES } = useRole();

    const esTecnico = rolActivo === ROLES.TECNICO;

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

                    {!esTecnico && (
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">▦</span>
                            <span>Dashboard</span>
                        </NavLink>
                    )}

                    {!esTecnico && (
                        <NavLink
                            to="/citas"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">▣</span>
                            <span>Calendario de Citas</span>
                        </NavLink>
                    )}

                    <NavLink
                        to="/kanban"
                        className={({ isActive }) =>
                            `menu-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="menu-icon">▤</span>
                        <span>{esTecnico ? "Mis Tickets Asignados" : "Tablero de Control"}</span>
                    </NavLink>
                </div>

                {/* GESTIÓN / OPERACIÓN DE TÉCNICO */}
                <div className="menu-section">
                    <span className="menu-title">{esTecnico ? "TALLER & DIAGNÓSTICO" : "GESTIÓN"}</span>

                    {!esTecnico && (
                        <NavLink
                            to="/clientes"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">♙</span>
                            <span>Clientes</span>
                        </NavLink>
                    )}

                    {!esTecnico && (
                        <NavLink
                            to="/inventario"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">▣</span>
                            <span>Inventario</span>
                        </NavLink>
                    )}

                    <NavLink
                        to="/ordenes-servicio"
                        className={({ isActive }) =>
                            `menu-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="menu-icon">⚙</span>
                        <span>{esTecnico ? "Diagnóstico y Reparación" : "Órdenes de Servicio"}</span>
                    </NavLink>

                    {!esTecnico && (
                        <NavLink
                            to="/facturacion"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">▤</span>
                            <span>Facturación</span>
                        </NavLink>
                    )}
                </div>

                {/* ANÁLISIS */}
                <div className="menu-section">
                    <span className="menu-title">ANÁLISIS</span>

                    {!esTecnico && (
                        <NavLink
                            to="/reportes"
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="menu-icon">▥</span>
                            <span>Reportes</span>
                        </NavLink>
                    )}

                    <NavLink
                        to="/metricas"
                        className={({ isActive }) =>
                            `menu-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="menu-icon">◉</span>
                        <span>{esTecnico ? "Mis Métricas" : "Métricas"}</span>
                    </NavLink>
                </div>

                {/* RRHH (SOLO SI NO ES TÉCNICO) */}
                {!esTecnico && (
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
                )}

                {/* ADMINISTRACIÓN (SOLO SI NO ES TÉCNICO) */}
                {!esTecnico && (
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
                )}

            </nav>

            {/* USUARIO & SELECTOR DE ROL */}
            <div className="sidebar-user-container">
                <div className="role-selector-box" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#8e9baf', display: 'block', marginBottom: '4px' }}>Perfil de Usuario:</label>
                    <select
                        value={rolActivo}
                        onChange={(e) => setRolActivo(e.target.value)}
                        style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '6px', fontSize: '0.85rem' }}
                    >
                        <option value={ROLES.ADMIN}>Administrador</option>
                        <option value={ROLES.ASESOR_SERVICIO}>Asesor de Servicio</option>
                        <option value={ROLES.ASESOR_REPUESTOS}>Asesor de Repuestos</option>
                        <option value={ROLES.TECNICO}>Técnico Automotriz</option>
                    </select>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">
                        {rolActivo.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="user-info">
                        <strong>{rolActivo}</strong>
                        <span>VERAMOTORS</span>
                    </div>
                </div>
            </div>

        </aside>
    );
}

export default Sidebar;