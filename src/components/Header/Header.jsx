import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import { obtenerMigas } from "../../config/navegacion";
import BuscadorModulos from "../BuscadorModulos/BuscadorModulos";
import "./Header.css";

const FECHA_HOY = new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
});

function Header({ abrirMenuMovil }) {
    const navigate = useNavigate();
    const location = useLocation();

    const { usuarioActual, rolActivo, ROLES, notificaciones, cerrarSesion: cerrarSesionContexto } = useRole();

    const [mostrarNotif, setMostrarNotif] = useState(false);
    const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
    const [mostrarBuscador, setMostrarBuscador] = useState(false);

    const notifRef = useRef(null);
    const usuarioRef = useRef(null);

    const nombreUsuario = usuarioActual?.nombre || "Usuario";
    const esAdministrador = rolActivo === ROLES.ADMIN;
    const inicio = rolActivo === ROLES.TECNICO ? "/kanban" : "/dashboard";
    const migas = obtenerMigas(usuarioActual?.rol || "", location.pathname);


    // ==========================================
    // NOTIFICACIONES
    // ==========================================

    const notifFiltradas = notificaciones.filter(
        n => !n.paraRol || n.paraRol === rolActivo
    );


    // ==========================================
    // CERRAR MENÚS AL HACER CLIC FUERA / ESC
    // ==========================================

    useEffect(() => {
        const alClicFuera = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setMostrarNotif(false);
            if (usuarioRef.current && !usuarioRef.current.contains(e.target)) setMostrarMenuUsuario(false);
        };
        const alTeclear = (e) => {
            if (e.key === "Escape") {
                setMostrarNotif(false);
                setMostrarMenuUsuario(false);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setMostrarBuscador(true);
            }
        };

        document.addEventListener("mousedown", alClicFuera);
        document.addEventListener("keydown", alTeclear);
        return () => {
            document.removeEventListener("mousedown", alClicFuera);
            document.removeEventListener("keydown", alTeclear);
        };
    }, []);


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    const cerrarSesion = () => {

        cerrarSesionContexto();

        // Cerrar menús
        setMostrarNotif(false);
        setMostrarMenuUsuario(false);

        // Ir al Login
        navigate("/login", {
            replace: true
        });
    };


    return (
        <header className="header">

            {/* MENÚ MÓVIL + MIGAS */}
            <div className="header-left">

                <button
                    type="button"
                    className="header-icon-btn header-menu-btn"
                    onClick={abrirMenuMovil}
                    aria-label="Abrir menú"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <nav className="breadcrumbs" aria-label="Ubicación">
                    <Link to={inicio} className="breadcrumb-home" title="Inicio">
                        <span className="material-symbols-outlined">home</span>
                    </Link>
                    {migas && (
                        <>
                            <span className="breadcrumb-sep breadcrumb-seccion" aria-hidden="true">/</span>
                            <span className="breadcrumb-seccion">{migas.seccion}</span>
                            <span className="breadcrumb-sep breadcrumb-sep-actual" aria-hidden="true">/</span>
                            <span className="breadcrumb-actual" aria-current="page">{migas.modulo}</span>
                        </>
                    )}
                </nav>

            </div>


            {/* BUSCADOR */}
            <button
                type="button"
                className="header-search"
                onClick={() => setMostrarBuscador(true)}
                aria-label="Buscar módulo"
            >
                <span className="material-symbols-outlined">search</span>
                <span className="header-search-text">Ir a un módulo…</span>
                <kbd>Ctrl K</kbd>
            </button>


            {/* ACCIONES */}
            <div className="header-right">

                <span className="header-date" title="Fecha de hoy">
                    <span className="material-symbols-outlined">event</span>
                    {FECHA_HOY.format(new Date())}
                </span>

                <button
                    type="button"
                    className="header-icon-btn header-search-mobile"
                    onClick={() => setMostrarBuscador(true)}
                    aria-label="Buscar módulo"
                >
                    <span className="material-symbols-outlined">search</span>
                </button>

                {esAdministrador && (
                    <Link to="/configuracion" className="header-icon-btn header-config-btn" title="Configuración" aria-label="Configuración">
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                )}

                {/* NOTIFICACIONES */}
                <div className="notification-wrapper" ref={notifRef}>

                    <button
                        type="button"
                        className="header-icon-btn"
                        onClick={() =>
                            setMostrarNotif(!mostrarNotif)
                        }
                        title="Notificaciones del sistema"
                        aria-label="Notificaciones del sistema"
                        aria-expanded={mostrarNotif}
                    >
                        <span className="material-symbols-outlined">notifications</span>

                        {notifFiltradas.length > 0 && (
                            <span className="notification-badge">
                                {notifFiltradas.length}
                            </span>
                        )}
                    </button>

                    {mostrarNotif && (
                        <div className="header-dropdown notification-dropdown">

                            <h4 className="header-dropdown-title">
                                Notificaciones ({rolActivo})
                            </h4>

                            {notifFiltradas.length === 0 ? (

                                <div className="vm-empty notification-empty">
                                    <span className="material-symbols-outlined">notifications_off</span>
                                    <span>Sin nuevas alertas.</span>
                                </div>

                            ) : (

                                <div className="notification-list">

                                    {notifFiltradas.map(n => (

                                        <div key={n.id} className="notification-item">
                                            <p>{n.mensaje}</p>
                                            <span>{n.tiempo}</span>
                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>
                    )}

                </div>

                {/* USUARIO */}
                <div className="header-user-wrapper" ref={usuarioRef}>

                    <button
                        type="button"
                        className="header-user"
                        onClick={() =>
                            setMostrarMenuUsuario(
                                !mostrarMenuUsuario
                            )
                        }
                        aria-expanded={mostrarMenuUsuario}
                        aria-label="Menú de usuario"
                    >
                        <div className="header-avatar">
                            {nombreUsuario
                                .substring(0, 2)
                                .toUpperCase()}
                        </div>

                        <div className="header-user-info">
                            <strong>{nombreUsuario}</strong>
                            <span>{rolActivo}</span>
                        </div>

                        <span className="material-symbols-outlined header-user-caret">expand_more</span>
                    </button>

                    {mostrarMenuUsuario && (
                        <div className="header-dropdown user-dropdown">

                            <div className="user-dropdown-info">
                                <strong>{nombreUsuario}</strong>
                                <span>{usuarioActual?.email}</span>
                            </div>

                            {esAdministrador && (
                                <Link
                                    to="/configuracion"
                                    className="user-dropdown-item"
                                    onClick={() => setMostrarMenuUsuario(false)}
                                >
                                    <span className="material-symbols-outlined">settings</span>
                                    Configuración
                                </Link>
                            )}

                            <button
                                type="button"
                                className="user-dropdown-item is-danger"
                                onClick={cerrarSesion}
                            >
                                <span className="material-symbols-outlined">logout</span>
                                Cerrar sesión
                            </button>

                        </div>
                    )}

                </div>

            </div>

            {mostrarBuscador && (
                <BuscadorModulos onCerrar={() => setMostrarBuscador(false)} />
            )}

        </header>
    );
}

export default Header;
