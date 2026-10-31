import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "../../context/authContext";

function ProtectedRoute({ children, rolesPermitidos = [] }) {
    const location = useLocation();
    const { usuarioActual } = useRole();

    if (!usuarioActual?.activo) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    const rolUsuario = usuarioActual?.rol ? String(usuarioActual.rol).trim() : "";

    if (
        rolesPermitidos.length > 0 &&
        !rolesPermitidos.some((r) => String(r).trim() === rolUsuario)
    ) {
        const rutaFallback = rolUsuario === "Técnico Automotriz" ? "/kanban" : "/dashboard";
        return <Navigate to={rutaFallback} replace />;
    }

    return children;
}

export default ProtectedRoute;
