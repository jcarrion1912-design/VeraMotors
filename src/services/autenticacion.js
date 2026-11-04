import { borrarSesion } from "../context/sesion";

const API_ORIGIN = "http://127.0.0.1:8000";
const RUTAS_SIN_REDIRECCION = ["/api/auth/", "/api/aprobacion-cliente/"];

// Los servicios y fetch directos del proyecto apuntan a API_ORIGIN. Aquí pasan a usar el mismo
// origen de la página (proxy /api), que es lo que permite enviar la cookie de sesión.
export function instalarAutenticacion() {
    const fetchOriginal = window.fetch.bind(window);

    window.fetch = async (entrada, opciones) => {
        const url = typeof entrada === "string" ? entrada : entrada.url ?? String(entrada);
        if (!url.startsWith(`${API_ORIGIN}/`)) {
            return fetchOriginal(entrada, opciones);
        }

        const ruta = url.slice(API_ORIGIN.length);
        const respuesta = await fetchOriginal(ruta, opciones);

        // Sesión vencida o usuario desactivado: la recarga limpia el estado de la app.
        if (respuesta.status === 401 && !RUTAS_SIN_REDIRECCION.some((r) => ruta.startsWith(r))) {
            borrarSesion();
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }

        return respuesta;
    };
}

// La pestaña se abre antes de la descarga porque, después de esperar, el navegador la bloquearía.
export async function abrirDocumentoProtegido(evento, url) {
    evento?.preventDefault();
    const pestana = window.open("", "_blank");

    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => null);
            throw new Error(error?.detail || `No se pudo abrir el documento (error ${respuesta.status}).`);
        }

        const objetoUrl = URL.createObjectURL(await respuesta.blob());
        if (pestana) {
            pestana.location.href = objetoUrl;
        } else {
            window.location.assign(objetoUrl);
        }
        setTimeout(() => URL.revokeObjectURL(objetoUrl), 60000);
    } catch (error) {
        pestana?.close();
        alert(error.message);
    }
}
