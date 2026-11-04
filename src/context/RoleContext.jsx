import { useMemo, useState } from "react";
import { RoleContext, ROLES } from "./authContext";
import { borrarSesion, guardarSesion, leerSesion } from "./sesion";
import { logout } from "../services/authService";

const NOTIFICACIONES_VACIAS = Object.freeze([]);

export function RoleProvider({ children }) {
    const [usuarioActual, setUsuarioActual] = useState(leerSesion);

    const iniciarSesion = (usuario) => {
        setUsuarioActual(usuario);
        if (usuario) {
            guardarSesion(usuario);
        }
    };

    const cerrarSesion = () => {
        setUsuarioActual(null);
        borrarSesion();
        // Borra la cookie en el servidor. Si falla, la cookie igual vence sola.
        logout().catch((error) => console.error("Error al cerrar sesión:", error));
    };

    const value = useMemo(() => ({
        usuarioActual,
        rolActivo: usuarioActual?.rol?.trim() || "",
        ROLES,
        notificaciones: NOTIFICACIONES_VACIAS,
        iniciarSesion,
        cerrarSesion,
    }), [usuarioActual]);

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
