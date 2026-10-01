import { useMemo, useState } from "react";
import { RoleContext, ROLES } from "./authContext";

const NOTIFICACIONES_VACIAS = Object.freeze([]);

export function RoleProvider({ children }) {
    const [usuarioActual, setUsuarioActual] = useState(null);
    const value = useMemo(() => ({
        usuarioActual,
        rolActivo: usuarioActual?.rol || "",
        ROLES,
        notificaciones: NOTIFICACIONES_VACIAS,
        iniciarSesion: setUsuarioActual,
        cerrarSesion: () => setUsuarioActual(null),
    }), [usuarioActual]);

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

