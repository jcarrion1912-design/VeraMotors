import { useMemo, useState } from "react";
import { RoleContext, ROLES } from "./authContext";

const NOTIFICACIONES_VACIAS = Object.freeze([]);
const STORAGE_KEY = "veramotors_usuario";

export function RoleProvider({ children }) {
    const [usuarioActual, setUsuarioActual] = useState(() => {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            return guardado ? JSON.parse(guardado) : null;
        } catch {
            return null;
        }
    });

    const iniciarSesion = (usuario) => {
        setUsuarioActual(usuario);
        if (usuario) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
            } catch (e) {
                console.error("Error guardando sesión:", e);
            }
        }
    };

    const cerrarSesion = () => {
        setUsuarioActual(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }
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
