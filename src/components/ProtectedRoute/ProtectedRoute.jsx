import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, rolesPermitidos = [] }) {
    const location = useLocation();

    const usuarioGuardado = localStorage.getItem("usuario");

    // ==========================================
    // NO HAY SESIÓN
    // ==========================================
    if (!usuarioGuardado) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardado);
    } catch (error) {
        console.error("Sesión inválida:", error);

        localStorage.removeItem("usuario");
        localStorage.removeItem("loginTime");

        return <Navigate to="/login" replace />;
    }

    // ==========================================
    // USUARIO DESACTIVADO
    // ==========================================
    if (!usuario.activo) {
        localStorage.removeItem("usuario");
        localStorage.removeItem("loginTime");

        return <Navigate to="/login" replace />;
    }

    // ==========================================
    // PERMISOS POR ROL
    // ==========================================
    if (
        rolesPermitidos.length > 0 &&
        !rolesPermitidos.includes(usuario.rol)
    ) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;