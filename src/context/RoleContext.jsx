import { createContext, useContext, useState } from "react";

const RoleContext = createContext();

export const ROLES = {
    ADMIN: "Administrador",
    ASESOR_SERVICIO: "Asesor de Servicio",
    ASESOR_REPUESTOS: "Asesor de Repuestos",
    TECNICO: "Técnico Automotriz"
};

export function RoleProvider({ children }) {
    const [rolActivo, setRolActivo] = useState(ROLES.ADMIN);
    const [notificaciones, setNotificaciones] = useState([
        { id: 1, mensaje: "Vehículo Toyota Hilux (ABC-123) asignado a diagnóstico.", tiempo: "hace 2 min", leido: false, paraRol: ROLES.TECNICO },
        { id: 2, mensaje: "Nuevos repuestos requeridos para ODS-1002.", tiempo: "hace 5 min", leido: false, paraRol: ROLES.ASESOR_REPUESTOS },
        { id: 3, mensaje: "Orden de Servicio ODS-1004 aprobada por el cliente.", tiempo: "hace 10 min", leido: false, paraRol: ROLES.ASESOR_SERVICIO },
    ]);

    const cambiarRol = (nuevoRol) => {
        setRolActivo(nuevoRol);
    };

    const agregarNotificacion = (mensaje, paraRol) => {
        setNotificaciones(prev => [
            { id: Date.now(), mensaje, tiempo: "hace un momento", leido: false, paraRol },
            ...prev
        ]);
    };

    return (
        <RoleContext.Provider value={{ rolActivo, setRolActivo: cambiarRol, ROLES, notificaciones, agregarNotificacion }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
