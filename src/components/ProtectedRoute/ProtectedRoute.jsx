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

    if (
        rolesPermitidos.length > 0 &&
        !rolesPermitidos.includes(usuarioActual.rol)
    ) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;