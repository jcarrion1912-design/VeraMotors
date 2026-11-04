import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import { obtenerSeccionesDeRol } from "../../config/navegacion";
import { BrandMark } from "../Brand/Brand";
import "./Sidebar.css";

function Sidebar({ colapsado, abiertoMovil, alternarColapso, cerrarMovil }) {
    const navigate = useNavigate();
    const { usuarioActual, cerrarSesion: cerrarSesionContexto } = useRole();

    const rol = usuarioActual?.rol || "";
    const secciones = obtenerSeccionesDeRol(rol);

    // Cerrar sesión
    const cerrarSesion = () => {
        cerrarSesionContexto();

        navigate("/login", { replace: true });
    };

    const clases = [
        "sidebar",
        colapsado ? "is-collapsed" : "",
        abiertoMovil ? "is-open" : "",
    ].join(" ");

    return (
        <aside className={clases} aria-label="Navegación principal">

            {/* MARCA */}
            <div className="sidebar-brand">
                <BrandMark size={36} />

                <div className="brand-info">
                    <h2>VERAMOTORS</h2>
                    <span>Gestión de taller</span>
                </div>

                <button
                    type="button"
                    className="sidebar-close"
                    onClick={cerrarMovil}
                    aria-label="Cerrar menú"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>


            {/* MENÚ */}
            <nav className="sidebar-menu">
                {secciones.map((seccion) => (
                    <div className="menu-section" key={seccion.titulo}>
                        <span className="menu-title">{seccion.titulo}</span>

                        {seccion.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                title={colapsado ? item.label : undefined}
                                onClick={cerrarMovil}
                                className={({ isActive }) =>
                                    `menu-item ${isActive ? "active" : ""}`
                                }
                            >
                                <span className="material-symbols-outlined menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>


            {/* CONTRAER */}
            <button
                type="button"
                className="sidebar-toggle"
                onClick={alternarColapso}
                aria-expanded={!colapsado}
                title={colapsado ? "Expandir menú" : "Contraer menú"}
            >
                <span className="material-symbols-outlined">
                    {colapsado ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
                </span>
                <span className="menu-label">Contraer menú</span>
            </button>


            {/* USUARIO + CERRAR SESIÓN */}
            <div className="sidebar-user-container">
                <div className="sidebar-user" title={colapsado ? usuarioActual?.nombre : undefined}>
                    <div className="user-avatar">
                        {usuarioActual?.nombre
                            ? usuarioActual.nombre
                                .substring(0, 2)
                                .toUpperCase()
                            : "VM"
                        }
                    </div>

                    <div className="user-info">
                        <strong>{usuarioActual?.nombre || "Usuario"}</strong>
                        <span>{usuarioActual?.rol || "Sin rol"}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="logout-button"
                    onClick={cerrarSesion}
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                >
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </div>

        </aside>
    );
}

export default Sidebar;
