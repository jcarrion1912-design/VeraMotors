import { createContext, useContext } from "react";

export const RoleContext = createContext(null);

export const ROLES = {
    ADMIN: "Administrador",
    ASESOR_SERVICIO: "Asesor de Servicio",
    ASESOR_REPUESTOS: "Asesor de Repuestos",
    TECNICO: "Técnico Automotriz",
};

export function useRole() {
    return useContext(RoleContext);
}
